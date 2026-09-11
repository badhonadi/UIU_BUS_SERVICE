import QRCode from 'qrcode';

export interface TicketData {
  ticketId: string;
  studentName: string;
  studentId: string;
  routeName: string;
  routeCode: string;
  busNumber: string;
  travelDate: string;
  direction: string;
  boardingStop: string;
  seatNumber: number;
  price: number;
  purchasedAt: string;
}

export async function generateQRCode(data: TicketData): Promise<string> {
  const qrData = JSON.stringify({
    id: data.ticketId,
    name: data.studentName,
    sid: data.studentId,
    route: data.routeCode,
    bus: data.busNumber,
    date: data.travelDate,
    dir: data.direction,
    seat: data.seatNumber,
  });

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1E3A5F',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function generateTicketHTML(data: TicketData, qrCodeDataUrl: string): string {
  const directionLabel = 'Round Trip - To and from UIU';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>UIU RideWave - Ticket ${data.ticketId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 20px; }
        .ticket { max-width: 400px; margin: 0 auto; background: #ffffff url('/bus-background.png') center / 80% auto no-repeat; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
        .ticket::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.9); }
        .ticket > * { position: relative; }
        .ticket-header { background: linear-gradient(135deg, #F37021, #E85D0A); color: white; padding: 20px; text-align: center; }
        .ticket-header h1 { font-size: 24px; font-weight: 700; }
        .ticket-header p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
        .ticket-body { padding: 24px; }
        .ticket-route { text-align: center; margin-bottom: 20px; }
        .ticket-route .route-name { font-size: 20px; font-weight: 700; color: #1E3A5F; }
        .ticket-route .direction { font-size: 14px; color: #F37021; font-weight: 600; margin-top: 4px; }
        .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 16px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { }
        .info-item .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
        .info-item .value { font-size: 14px; color: #1e293b; font-weight: 600; margin-top: 2px; }
        .qr-section { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0; }
        .qr-section img { width: 160px; height: 160px; }
        .qr-section p { font-size: 11px; color: #94a3b8; margin-top: 8px; }
        .ticket-footer { background: #f8fafc; padding: 12px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
        .ticket-id { font-family: monospace; font-size: 13px; color: #64748b; font-weight: 600; text-align: center; margin-top: 12px; }
        .price-badge { display: inline-block; background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 16px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <h1>🚌 UIU RideWave</h1>
          <p>E-Ticket • United International University</p>
        </div>
        <div class="ticket-body">
          <div class="ticket-route">
            <div class="route-name">${data.routeName}</div>
            <div class="direction">${directionLabel}</div>
            <div class="price-badge">৳${data.price}</div>
          </div>
          <hr class="divider" />
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Student</div>
              <div class="value">${data.studentName}</div>
            </div>
            <div class="info-item">
              <div class="label">Student ID</div>
              <div class="value">${data.studentId}</div>
            </div>
            <div class="info-item">
              <div class="label">Travel Date</div>
              <div class="value">${data.travelDate}</div>
            </div>
            <div class="info-item">
              <div class="label">Bus Number</div>
              <div class="value">${data.busNumber}</div>
            </div>
            <div class="info-item">
              <div class="label">Boarding Stop</div>
              <div class="value">${data.boardingStop}</div>
            </div>
            <div class="info-item">
              <div class="label">Seat Number</div>
              <div class="value">#${data.seatNumber}</div>
            </div>
          </div>
          <div class="ticket-id">Ticket: ${data.ticketId}</div>
          <div class="qr-section">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
            <p>Scan this QR code for verification</p>
          </div>
        </div>
        <div class="ticket-footer">
          <p>This ticket is valid only for the specified date and route.</p>
          <p>Issued at: ${data.purchasedAt}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
