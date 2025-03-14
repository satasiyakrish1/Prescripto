import jsPDF from 'jspdf';

export const generateIncomeReport = (data) => {
    const doc = new jsPDF();
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

    return doc;
};