import React, { forwardRef } from 'react';
import { format } from 'date-fns';

const Receipt = forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy hh:mm a');
  };

  return (
    <div ref={ref} className="p-6 bg-white w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Prescripto Pharmacy</h2>
        <p className="text-sm">123 Health Street, Medical District</p>
        <p className="text-sm">Phone: (123) 456-7890</p>
        <p className="text-sm">Email: pharmacy@prescripto.com</p>
      </div>

      <div className="border-t border-b border-gray-300 py-2 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">Invoice #:</span>
          <span>{sale.invoice_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Date:</span>
          <span>{formatDate(sale.sold_at || sale.createdAt)}</span>
        </div>
        {sale.customer && (
          <div className="flex justify-between">
            <span className="font-semibold">Customer:</span>
            <span>{sale.customer}</span>
          </div>
        )}
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 text-sm">{item.name}</td>
              <td className="py-2 text-right text-sm">{item.quantity}</td>
              <td className="py-2 text-right text-sm">₹{item.price.toFixed(2)}</td>
              <td className="py-2 text-right text-sm">₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-4">
        <div className="flex justify-between py-1">
          <span className="font-semibold">Subtotal:</span>
          <span>₹{sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between py-1">
            <span className="font-semibold">Discount:</span>
            <span>₹{sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between py-1">
          <span className="font-semibold">GST:</span>
          <span>₹{sale.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 text-lg font-bold">
          <span>Total:</span>
          <span>₹{sale.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">Payment Method:</span>
          <span>{sale.payment_method}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Payment Status:</span>
          <span>{sale.payment_status || sale.status}</span>
        </div>
      </div>

      <div className="text-center text-sm mt-8">
        <p>Thank you for your purchase!</p>
        <p className="mt-2">For returns and exchanges, please bring this receipt within 7 days.</p>
        <p className="mt-4">* This is a computer-generated receipt and does not require a signature *</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;