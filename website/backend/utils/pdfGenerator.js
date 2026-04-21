import jsPDF from 'jspdf';

export const generatePDF = (template, data) => {
    const doc = new jsPDF();
    
    // Based on the template type, generate different PDF formats
    switch(template) {
        case 'eventParticipants':
            return generateEventParticipantsPDF(doc, data);
        case 'incomeReport':
            return generateIncomeReportPDF(doc, data);
        default:
            // Default simple PDF with just the data stringified
            doc.setFontSize(12);
            doc.text('Generated PDF', 20, 20);
            doc.text(JSON.stringify(data, null, 2), 20, 30);
            return doc.output('arraybuffer');
    }
};

const generateEventParticipantsPDF = (doc, data) => {
    const { event, participants, date } = data;
    let yOffset = 20;
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Event Participants: ${event.title}`, 20, yOffset);
    yOffset += 15;
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${date}`, 20, yOffset);
    yOffset += 10;
    
    // Add event details
    doc.text(`Event Date: ${new Date(event.date).toLocaleDateString()}`, 20, yOffset);
    yOffset += 10;
    doc.text(`Location: ${event.location}`, 20, yOffset);
    yOffset += 10;
    doc.text(`Total Participants: ${participants.length}`, 20, yOffset);
    yOffset += 15;
    
    // Add participants table header
    doc.setFontSize(14);
    doc.text('Participants List', 20, yOffset);
    yOffset += 10;
    
    // Table headers
    doc.setFontSize(12);
    doc.text('Name', 20, yOffset);
    doc.text('Email', 80, yOffset);
    doc.text('Status', 160, yOffset);
    yOffset += 8;
    
    // Draw a line
    doc.line(20, yOffset, 190, yOffset);
    yOffset += 10;
    
    // Add participants
    participants.forEach(participant => {
        // Check if we need a new page
        if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
            
            // Add table headers on new page
            doc.text('Name', 20, yOffset);
            doc.text('Email', 80, yOffset);
            doc.text('Status', 160, yOffset);
            yOffset += 8;
            doc.line(20, yOffset, 190, yOffset);
            yOffset += 10;
        }
        
        doc.text(participant.name, 20, yOffset);
        doc.text(participant.email, 80, yOffset);
        doc.text(participant.status, 160, yOffset);
        yOffset += 10;
    });
    
    return doc.output('arraybuffer');
};

const generateIncomeReportPDF = (doc, data) => {
    let yOffset = 20;

    // Add title
    doc.setFontSize(18);
    doc.text('Monthly Income Report', 20, yOffset);
    yOffset += 20;

    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yOffset);
    yOffset += 20;

    // Add total income
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, yOffset);
    yOffset += 20;

    // Add monthly breakdown header
    doc.setFontSize(14);
    doc.text('Monthly Revenue Breakdown', 20, yOffset);
    yOffset += 10;

    // Add monthly data
    doc.setFontSize(12);
    data.forEach(item => {
        doc.text(`${item.month}: $${item.income.toFixed(2)}`, 30, yOffset);
        yOffset += 10;

        // Add doctor-wise breakdown
        if (item.doctors) {
            item.doctors.forEach(doctor => {
                doc.text(`  - Dr. ${doctor.name}: $${doctor.income.toFixed(2)}`, 40, yOffset);
                yOffset += 10;
            });
        }

        // Add spacing between months
        yOffset += 5;

        // Check if we need a new page
        if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
        }
    });

    return doc.output('arraybuffer');
};