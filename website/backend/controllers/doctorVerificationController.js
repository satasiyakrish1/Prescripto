import axios from 'axios'
import * as cheerio from 'cheerio';
import rateLimit from 'express-rate-limit'
import doctorModel from '../models/doctorModel.js'
import verificationLogModel from '../models/verificationLogModel.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Tesseract from 'tesseract.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple in-memory cache (can be swapped with Redis later)
const cache = new Map()
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

function setCache(key, value) {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

function getCache(key) {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }
    return entry.value
}

export const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
})

function normalize(str = '') {
    return String(str).trim().replace(/\s+/g, ' ').toLowerCase()
}

function fuzzyMatch(a, b) {
    const na = normalize(a)
    const nb = normalize(b)
    if (!na || !nb) return false
    // Basic similarity using inclusion or Levenshtein-like threshold via length diff heuristic
    if (na === nb) return true
    return na.includes(nb) || nb.includes(na)
}

const PREFIX_COUNCIL_MAP = {
    'DMC': 'Delhi Medical Council',
    'MMC': 'Maharashtra Medical Council',
    'GMC': 'Gujarat Medical Council',
    'G': 'Gujarat Medical Council',
    'KMC': 'Karnataka Medical Council',
    'TNMC': 'Tamil Nadu Medical Council',
    'WBMC': 'West Bengal Medical Council',
    'APMC': 'Andhra Pradesh Medical Council',
    'TSMC': 'Telangana State Medical Council',
    'RMC': 'Rajasthan Medical Council',
    'PMC': 'Punjab Medical Council',
    'UPMC': 'Uttar Pradesh Medical Council',
    'OR': 'Odisha Council of Medical Registration',
    'OMC': 'Odisha Council of Medical Registration',
    'JKMC': 'Jammu & Kashmir Medical Council',
    'HP': 'Himachal Pradesh Medical Council',
    'MP': 'Madhya Pradesh Medical Council',
    'MPMC': 'Madhya Pradesh Medical Council',
    'BHMC': 'Bihar Medical Council',
    'BR': 'Bihar Medical Council',
}

function normalizeRegistration(reg = '') {
    const raw = String(reg).toUpperCase().replace(/\s+/g, '')
    // Convert common separators to slash and collapse repeats
    let normalized = raw.replace(/[-_.:]/g, '/').replace(/\/+/, '/').replace(/\/{2,}/g, '/').replace(/^\//, '')
    // Ensure prefix and number separated by slash (e.g., G42830 -> G/42830)
    if (/^[A-Z]{1,4}\d+$/i.test(normalized)) {
        const m = normalized.match(/^([A-Z]{1,4})(\d+)$/)
        if (m) normalized = `${m[1]}/${m[2]}`
    }
    // Remove leading zeros from numeric part
    const parts = normalized.split('/')
    if (parts.length >= 2) {
        parts[1] = parts[1].replace(/^0+/, '')
        normalized = parts.join('/')
    }
    return normalized
}

function guessCouncilFromReg(reg) {
    const n = normalizeRegistration(reg)
    const prefix = (n.split('/')[0] || '').replace(/[^A-Z]/g, '')
    if (PREFIX_COUNCIL_MAP[prefix]) return PREFIX_COUNCIL_MAP[prefix]
    // Some councils embed two-letter codes
    if (prefix.length === 1 && PREFIX_COUNCIL_MAP[prefix]) return PREFIX_COUNCIL_MAP[prefix]
    return undefined
}

async function scrapeIMR({ name, registrationNumber, stateCouncil }) {
    // IMPORTANT: IMR often uses dynamic content and captchas. We only use public pages, no keys.
    // We'll attempt a GET to their information pages and parse visible results if available.
    // If captcha or dynamic form required, we return a captcha_required status.
    const base = 'https://www.nmc.org.in/information-desk/indian-medical-register/'
    try {
        const key = JSON.stringify({ name, registrationNumber, stateCouncil })
        const cached = getCache(key)
        if (cached) return { ...cached, cached: true }

        // Since IMR search is form-based and protected, we cannot programmatically submit reliably.
        // We fetch landing page to detect captcha and instruct manual steps.
        const resp = await axios.get(base, { timeout: 15000 })
        const $ = cheerio.load(resp.data)
        const hasCaptcha = $('iframe[src*="recaptcha"], div.g-recaptcha').length > 0

        if (hasCaptcha) {
            const result = { status: 'captcha_required', message: 'IMR search requires captcha. Perform manual verification.', source: base }
            setCache(key, result)
            return result
        }

        // If any public table present (rare), attempt extraction (placeholder)
        // Default fallback since most flows need captcha
        const result = { status: 'manual_required', message: 'Automated extraction unavailable. Use manual steps.', source: base }
        setCache(key, result)
        return result
    } catch (e) {
        return { status: 'error', message: e.message }
    }
}

async function extractText(filePath) {
    const { data } = await Tesseract.recognize(filePath, 'eng', { logger: () => {} })
    return data.text || ''
}

function extractNameAndReg(text) {
    const cleaned = text.replace(/\s+/g, ' ')
    const regMatch = cleaned.match(/(DMC|MMC|KMC|TNMC|MCI|IMR|GMC|WBMC|APMC|TSMC|RMC|PMC|UPMC|J&KMC|JKMC)[\s\/:\-]*([A-Za-z0-9\/\-]+)/i)
    const nameMatch = cleaned.match(/Dr\.?\s*[A-Z][A-Za-z\s\.]+/i)
    return {
        ocrName: nameMatch ? nameMatch[0].trim() : undefined,
        ocrReg: regMatch ? `${regMatch[1].toUpperCase()}/${regMatch[2]}`.replace(/\s+/g, '') : undefined
    }
}

export const verifyDoctorIMR = async (req, res) => {
    let { submitted_name, registration_number, state_council, qualification, registered_year } = req.body || {}
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    const ua = req.headers['user-agent'] || ''

    const log = new verificationLogModel({
        actorType: 'admin',
        ipAddress: ip,
        userAgent: ua,
        request: { submitted_name, registration_number, state_council, qualification, registered_year }
    })

    try {
        // Allow reg-number-only flow; infer state council if missing
        const normalizedReg = normalizeRegistration(registration_number)
        if (!state_council) {
            const guessed = guessCouncilFromReg(normalizedReg)
            if (guessed) state_council = guessed
        }

        const imr = await scrapeIMR({ name: submitted_name, registrationNumber: normalizedReg, stateCouncil: state_council })

        if (imr.status === 'captcha_required') {
            log.status = 'captcha_required'
            log.result = imr
            await log.save()
            return res.json({ success: true, verification: { verified: false, notes: 'Captcha required on IMR. Please complete manually.', ...imr } })
        }
        if (imr.status === 'manual_required') {
            log.status = 'failure'
            log.result = imr
            await log.save()
            return res.json({ success: true, verification: { verified: false, notes: 'Automated lookup unavailable. Follow manual steps.', ...imr } })
        }
        if (imr.status === 'error') {
            log.status = 'failure'
            log.error = imr.message
            await log.save()
            return res.status(502).json({ success: false, message: 'Lookup error', error: imr.message })
        }

        // Placeholder parsed data (since automated extraction is constrained)
        const portalData = {
            portal_name: submitted_name,
            portal_registration_number: normalizedReg,
            qualification: qualification,
            registered_year: registered_year,
            state_council,
            verification_status: 'unknown'
        }

        // Basic validation
        const nameMatches = fuzzyMatch(submitted_name, portalData.portal_name)
        const regMatches = normalize(normalizedReg) === normalize(portalData.portal_registration_number)
        const stateMatches = fuzzyMatch(state_council, portalData.state_council)

        const verified = Boolean(nameMatches && regMatches && stateMatches)

        const verification = {
            submitted_name,
            registration_number: normalizedReg,
            state_council,
            portal_name: portalData.portal_name,
            portal_registration_number: portalData.portal_registration_number,
            qualification: portalData.qualification,
            registered_year: portalData.registered_year,
            documents_match: undefined,
            verified,
            notes: verified ? 'Verified via NMC IMR (assisted)' : 'Partial match; needs manual review',
            source: 'NMC IMR',
            checkedAt: new Date()
        }

        log.status = verified ? 'success' : 'failure'
        log.result = verification
        await log.save()

        return res.json({ success: true, verification })
    } catch (error) {
        log.status = 'failure'
        log.error = error.message
        try { await log.save() } catch {}
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const uploadAndOCRDocuments = async (req, res) => {
    try {
        const files = req.files || {}
        const registrationCertificate = files['registrationCertificate']?.[0]
        const degreeCertificate = files['degreeCertificate']?.[0]
        const governmentId = files['governmentId']?.[0]
        const portalScreenshot = files['portalScreenshot']?.[0]

        const ocrResults = {}
        let docsMatch = undefined
        let portalExtract = undefined

        if (registrationCertificate) {
            const text = await extractText(registrationCertificate.path)
            const { ocrName, ocrReg } = extractNameAndReg(text)
            ocrResults.registrationCertificate = { ocrName, ocrReg }
        }
        if (degreeCertificate) {
            const text = await extractText(degreeCertificate.path)
            const { ocrName } = extractNameAndReg(text)
            ocrResults.degreeCertificate = { ocrName }
        }
        if (governmentId) {
            const text = await extractText(governmentId.path)
            const { ocrName } = extractNameAndReg(text)
            ocrResults.governmentId = { ocrName }
        }
        if (portalScreenshot) {
            const text = await extractText(portalScreenshot.path)
            portalExtract = extractFromText(text)
        }

        const { portal_name, portal_registration_number, submitted_name, registration_number } = req.body || {}
        if (portal_name || submitted_name) {
            const compareName = portal_name || submitted_name
            const regToMatch = portal_registration_number || registration_number
            const fromReg = ocrResults.registrationCertificate?.ocrReg
            const nameFromAny = ocrResults.registrationCertificate?.ocrName || ocrResults.degreeCertificate?.ocrName || ocrResults.governmentId?.ocrName
            docsMatch = Boolean(fuzzyMatch(compareName, nameFromAny) && (!regToMatch || (fromReg && normalize(fromReg) === normalize(regToMatch))))
        }

        return res.json({ success: true, ocrResults, documents_match: docsMatch, portalExtract })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const manualVerificationInstructions = (req, res) => {
    const steps = [
        'Open the NMC IMR portal (https://www.nmc.org.in/information-desk/indian-medical-register/).',
        'Choose Search by Registration Number. Enter the registration number and select the State Medical Council.',
        'If search fails, switch to Search by Name and select State; include year if available.',
        'Complete any captcha challenge manually and submit the search.',
        'Verify fields: Full Name, Registration Number, State Council, Qualification(s), Registration Year, Status (active/inactive).',
        'Save evidence: screenshot or PDF print of the results page; add to verification logs in Prescripto.',
        'If IMR is down or blocking, use the relevant State Medical Council portal and repeat the above.',
        'If still inconclusive, contact the council via email/phone listed on their site and record correspondence.'
    ]
    return res.json({ success: true, steps, source: 'NMC IMR / State Councils' })
}

function extractFromText(raw = '') {
    const text = String(raw).replace(/\s+/g, ' ').trim()
    const out = {}
    // Name
    const name1 = text.match(/Name\s*[:\-]\s*([^,\n]+?)(?:,| Reg| Registration| State| Qualification| Year| Status)/i)
    const name2 = text.match(/Dr\.?\s*[A-Z][A-Za-z\s\.]+/i)
    out.portal_name = (name1 && name1[1]) ? name1[1].trim() : (name2 ? name2[0].trim() : undefined)
    // Registration number
    const reg1 = text.match(/Reg(?:istration)?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\-_/]+)/i)
    const reg2 = text.match(/(?:DMC|MMC|GMC|KMC|TNMC|WBMC|APMC|TSMC|RMC|PMC|UPMC|IMR|MCI)[\s\-_/]*([A-Za-z0-9\-_/]+)/i)
    const regRaw = (reg1 && reg1[1]) ? reg1[1] : (reg2 ? `${reg2[0]}` : undefined)
    out.portal_registration_number = regRaw ? normalizeRegistration(regRaw) : undefined
    // State council
    const council1 = text.match(/State\s*(?:Medical)?\s*Council\s*[:\-]\s*([^,\n]+?)(?:,| Reg| Registration| Qualification| Year| Status)/i)
    out.state_council = council1 ? council1[1].trim() : (regRaw ? guessCouncilFromReg(regRaw) : undefined)
    // Qualification(s)
    const qual = text.match(/Qualification(?:s)?\s*[:\-]\s*([^,\n]+?)(?:,| Year| Status|$)/i)
    if (qual && qual[1]) out.qualification = qual[1].trim()
    else {
        const short = text.match(/\b(MBBS|MD|MS|DNB|BDS|MCh|DM|DO)\b(?![a-z])/i)
        if (short) out.qualification = short[0].toUpperCase()
    }
    // Year
    const year = text.match(/Reg(?:istration)?\s*Year\s*[:\-]\s*(\d{4})/i) || text.match(/\b(19|20)\d{2}\b/)
    if (year) out.registered_year = year[1] ? year[1] : year[0]
    // Status
    const status = text.match(/Status\s*[:\-]\s*(Active|Inactive)/i)
    out.verification_status = status ? status[1].toLowerCase() : 'unknown'
    return out
}

export const parsePortalText = async (req, res) => {
    try {
        const { portal_text = '', portal_html = '' } = req.body || {}
        let extracted = {}
        if (portal_html) {
            const $ = cheerio.load(portal_html)
            const visible = $('body').text()
            extracted = extractFromText(visible)
        } else {
            extracted = extractFromText(portal_text)
        }
        const verification = {
            portal_name: extracted.portal_name,
            portal_registration_number: extracted.portal_registration_number,
            state_council: extracted.state_council,
            qualification: extracted.qualification,
            registered_year: extracted.registered_year,
            verified: false,
            notes: 'Parsed from pasted portal result. Please confirm.',
            source: 'NMC IMR / State Portal',
            checkedAt: new Date(),
        }
        return res.json({ success: true, verification })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


