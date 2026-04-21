import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Ward from '../models/wardModel.js';
import Admission from '../models/admissionModel.js';
import jwt from 'jsonwebtoken';

let adminToken;
let testDepartmentId;
let testBedId;
let testDoctorId;
let testPatientId;
let testAdmissionId;

// Mock data
const mockDepartment = {
  name: 'Test Department',
  description: 'Department for testing',
  floor: 1
};

// Rest of the test file content...
// Note: You'll need to update the rest of the file to use ES module syntax as well