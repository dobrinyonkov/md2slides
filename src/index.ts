import express from 'express';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Server-Side Visitor Tracking Logging Middleware
// ============================================================================
// Logs visitor information without storing personal data:
// - Timestamp (UTC)
// - Request path
// - Request method (GET, POST, etc.)
// - User agent (browser/app info)
// - Response status code

interface VisitorLog {
  timestamp: string;
  path: string;
  method: string;
  userAgent: string;
  statusCode: number;
}

// Function to format timestamp in ISO 8601 format
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Function to log visitor data
const logVisitor = (log: VisitorLog): void => {
  const logEntry = JSON.stringify(log);
  console.log(`[VISITOR_LOG] ${logEntry}`);
  
  // Optional: Also write to a file for persistent storage
  const logFilePath = path.join(process.cwd(), 'logs', 'visitor-tracking.log');
  try {
    const logsDir = path.dirname(logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(logFilePath, logEntry + '\n');
  } catch (error) {
    console.error('Error writing to visitor log file:', error);
  }
};

// Middleware to capture and log visitor information
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Capture the original res.send function
  const originalSend = res.send;
  
  // Override res.send to log after response is sent
  res.send = function(data: any): Response {
    const responseTime = Date.now() - startTime;
    
    const visitorLog: VisitorLog = {
      timestamp: getTimestamp(),
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent') || 'Unknown',
      statusCode: res.statusCode,
    };
    
    logVisitor(visitorLog);
    
    // Call the original send method
    return originalSend.call(this, data);
  };
  
  next();
});

// ============================================================================
// Express Middleware Setup
// ============================================================================

// Parse JSON request bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================================
// API Endpoints
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: getTimestamp() });
});

// Conversion endpoint (example - customize as needed)
app.post('/api/convert', (req: Request, res: Response) => {
  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ error: 'Markdown content is required' });
    }
    
    // TODO: Add your markdown to slides conversion logic here
    
    res.json({
      success: true,
      message: 'Conversion processed',
      timestamp: getTimestamp(),
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve main index.html for all other routes (SPA support)
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Visitor tracking enabled`);
  console.log(`✓ Logs directory: ${path.join(process.cwd(), 'logs')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
