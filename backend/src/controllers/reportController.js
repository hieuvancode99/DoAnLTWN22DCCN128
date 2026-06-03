const Transaction = require('../models/Transaction');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper to find a Vietnamese-supporting font on Windows or fallback
const getFontPath = () => {
  const paths = [
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\Calibri.ttf',
    'C:\\Windows\\Fonts\\tahoma.ttf'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null; // Let pdfkit fallback to Helvetica
};

// @desc    Export transactions report (Excel or PDF)
// @route   GET /api/reports/export
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;

    if (!format || !['xlsx', 'pdf'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Please specify format as xlsx or pdf' });
    }

    // Build filter
    const query = { userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .populate('categoryId')
      .sort({ date: -1 });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo chi tiêu');

      // Style configurations
      worksheet.columns = [
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Danh mục', key: 'category', width: 20 },
        { header: 'Loại', key: 'type', width: 15 },
        { header: 'Số tiền (VND)', key: 'amount', width: 20 },
        { header: 'Mô tả', key: 'description', width: 35 }
      ];

      // Format headers
      worksheet.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' } // Indigo color
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Add rows
      transactions.forEach(t => {
        const row = worksheet.addRow({
          date: new Date(t.date).toLocaleDateString('vi-VN'),
          category: t.categoryId ? t.categoryId.name : 'Chưa phân loại',
          type: t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
          amount: t.amount,
          description: t.description || ''
        });

        // Alignments and colors
        row.getCell('amount').numFmt = '#,##0';
        row.getCell('type').font = {
          color: { argb: t.type === 'income' ? '10B981' : 'EF4444' }, // Emerald or Red
          bold: true
        };
      });

      // Add summary info
      worksheet.addRow([]);
      const s1 = worksheet.addRow({ category: 'Tổng Thu nhập', amount: totalIncome });
      s1.getCell('category').font = { bold: true };
      s1.getCell('amount').font = { bold: true, color: { argb: '10B981' } };
      s1.getCell('amount').numFmt = '#,##0';

      const s2 = worksheet.addRow({ category: 'Tổng Chi tiêu', amount: totalExpense });
      s2.getCell('category').font = { bold: true };
      s2.getCell('amount').font = { bold: true, color: { argb: 'EF4444' } };
      s2.getCell('amount').numFmt = '#,##0';

      const s3 = worksheet.addRow({ category: 'Số dư ròng', amount: netBalance });
      s3.getCell('category').font = { bold: true };
      s3.getCell('amount').font = { bold: true, color: { argb: netBalance >= 0 ? '10B981' : 'EF4444' } };
      s3.getCell('amount').numFmt = '#,##0';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${Date.now()}.xlsx"`);

      await workbook.xlsx.write(res);
      return res.end();

    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${Date.now()}.pdf"`);

      doc.pipe(res);

      const font = getFontPath();
      if (font) {
        doc.registerFont('CustomArial', font);
        doc.font('CustomArial');
      }

      // Title header
      doc.fontSize(24).fillColor('#4F46E5').text('BÁO CÁO CHI TIÊU CÁ NHÂN', { align: 'center' });
      doc.moveDown(0.5);
      
      const dateRangeStr = (startDate || endDate) 
        ? `Từ ngày: ${startDate || 'Đầu'} đến: ${endDate || 'Hiện tại'}`
        : 'Toàn bộ thời gian';
      doc.fontSize(10).fillColor('#6B7280').text(dateRangeStr, { align: 'center' });
      doc.moveDown(1.5);

      // Financial Overview Card
      doc.fillColor('#F3F4F6').rect(50, doc.y, 512, 80).fill();
      doc.fillColor('#000000');
      
      const currentY = doc.y;
      doc.fontSize(12).fillColor('#10B981').text(`TỔNG THU:`, 70, currentY + 15);
      doc.fontSize(14).fillColor('#10B981').text(`${totalIncome.toLocaleString('vi-VN')} đ`, 70, currentY + 30);

      doc.fontSize(12).fillColor('#EF4444').text(`TỔNG CHI:`, 240, currentY + 15);
      doc.fontSize(14).fillColor('#EF4444').text(`${totalExpense.toLocaleString('vi-VN')} đ`, 240, currentY + 30);

      doc.fontSize(12).fillColor('#4F46E5').text(`SỐ DƯ RÒNG:`, 410, currentY + 15);
      doc.fontSize(14).fillColor('#4F46E5').text(`${netBalance.toLocaleString('vi-VN')} đ`, 410, currentY + 30);

      doc.y = currentY + 100;
      doc.moveDown();

      // Transaction Table
      doc.fontSize(14).fillColor('#1F2937').text('Danh sách giao dịch chi tiết', { underline: true });
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#4B5563');
      doc.text('Ngày', 50, tableTop);
      doc.text('Danh mục', 120, tableTop);
      doc.text('Loại', 220, tableTop);
      doc.text('Mô tả', 280, tableTop);
      doc.text('Số tiền', 480, tableTop, { align: 'right', width: 80 });

      doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).strokeColor('#E5E7EB').stroke();
      
      let y = tableTop + 25;
      
      transactions.forEach((t) => {
        // Page break if too low
        if (y > 700) {
          doc.addPage();
          if (font) doc.font('CustomArial');
          y = 50;
        }

        doc.fontSize(9).fillColor('#374151');
        doc.text(new Date(t.date).toLocaleDateString('vi-VN'), 50, y);
        doc.text(t.categoryId ? t.categoryId.name : 'Chưa phân loại', 120, y);
        
        if (t.type === 'income') {
          doc.fillColor('#10B981').text('Thu nhập', 220, y);
        } else {
          doc.fillColor('#EF4444').text('Chi tiêu', 220, y);
        }

        doc.fillColor('#374151').text(t.description || '-', 280, y, { width: 190, height: 12, ellipsis: true });
        
        const amountStr = `${t.amount.toLocaleString('vi-VN')} đ`;
        doc.fillColor('#1F2937').text(amountStr, 480, y, { align: 'right', width: 80 });

        y += 20;
      });

      doc.end();
    }

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { exportReport };
