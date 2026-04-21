import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Generate Excel file for staff data
const generateStaffExcel = async (staffList) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Staff List');

  // Define columns
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Contact Number', key: 'contactNumber', width: 15 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Joining Date', key: 'joiningDate', width: 15 }
  ];

  // Add data
  staffList.forEach(staff => {
    worksheet.addRow({
      name: staff.name,
      email: staff.email,
      role: staff.role === 'custom' ? staff.customRole : staff.role,
      department: staff.department,
      contactNumber: staff.contactNumber || '',
      address: staff.address || '',
      status: staff.status,
      joiningDate: new Date(staff.joiningDate).toLocaleDateString()
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Generate PDF file for staff data
const generateStaffPDF = async (staffList) => {
  return new Promise((resolve) => {
    const chunks = [];
    const doc = new PDFDocument();

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Add title
    doc.fontSize(16).text('Staff List', { align: 'center' });
    doc.moveDown();

    // Define table layout
    const tableTop = 150;
    const rowHeight = 30;
    let currentTop = tableTop;

    // Add table headers
    doc.fontSize(10);
    const headers = ['Name', 'Role', 'Department', 'Contact', 'Status'];
    const columnWidth = 110;
    let currentLeft = 50;

    headers.forEach(header => {
      doc.text(header, currentLeft, currentTop);
      currentLeft += columnWidth;
    });

    // Add horizontal line after headers
    currentTop += 20;
    doc.moveTo(50, currentTop).lineTo(550, currentTop).stroke();
    currentTop += 10;

    // Add data rows
    staffList.forEach(staff => {
      if (currentTop > 700) {
        doc.addPage();
        currentTop = 50;
      }

      currentLeft = 50;
      doc.text(staff.name, currentLeft, currentTop);
      currentLeft += columnWidth;
      
      const role = staff.role === 'custom' ? staff.customRole : staff.role;
      doc.text(role, currentLeft, currentTop);
      currentLeft += columnWidth;
      
      doc.text(staff.department, currentLeft, currentTop);
      currentLeft += columnWidth;
      
      doc.text(staff.contactNumber || '', currentLeft, currentTop);
      currentLeft += columnWidth;
      
      doc.text(staff.status, currentLeft, currentTop);

      currentTop += rowHeight;
    });

    doc.end();
  });
};

export { generateStaffExcel, generateStaffPDF };