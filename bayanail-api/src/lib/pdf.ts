import PDFDocument from "pdfkit";
import { uploadFile } from "./storage.js";

export const generateInvoicePDF = async (invoiceData: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const filename = `invoice-${invoiceData.number}.pdf`;
      
      try {
        const url = await uploadFile({
          buffer: pdfBuffer,
          originalname: filename,
          mimetype: "application/pdf"
        } as any, `invoices/${filename}`);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });

    // Content
    doc.fontSize(25).text("FACTURE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Numéro: ${invoiceData.number}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Client: ${invoiceData.customerName}`);
    doc.moveDown();
    doc.text(`Description: ${invoiceData.description}`);
    doc.text(`Montant: ${invoiceData.amount} €`);
    doc.moveDown();
    doc.text("Merci de votre confiance !", { align: "center" });
    
    doc.end();
  });
};

