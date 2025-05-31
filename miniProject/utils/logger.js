const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Transport = require("winston-transport");


const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}


const telegramFormatter = winston.format((info) => {
    if (info.level === "error") {
        const message = `🚨 *ERROR LOG*\n*${info.message}*\n🕒 ${new Date().toISOString()}`;
        axios.post(`https://api.telegram.org/bot7765173205:AAEW4j-dAvCDWigOq8y3HpE6aTYIBiBIXHI/sendMessage`, {
            chat_id: "5172235346",
            text: message,
            parse_mode: "Markdown",
        }).catch((err) => {
            console.error("Telegram error:", err.message);
        });
    }
    return info;
});


class EmailTransport extends Transport {
    constructor(opts) {
        super(opts);
        this.mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: false, // 
            requireTLS: true,
            auth: {
                user:process.env.SMTP_MAIL ,
                pass: process.env.SMTP_PASS,// Gmail App Password
            },
        });
    }

    log(info, callback) {
        if (info.level === "error") {
            const userEmail = info.userEmail 
            
            const message = {
                from: process.env.SMTP_MAIL,
                to: userEmail,  
                subject: "🚨 Server Error Log",
                text: `${info.message}\n\nTime: ${new Date().toISOString()}`,
            };
    
            this.mailer.sendMail(message, (err) => {
                if (err) {
                    console.error("Email send error:", err.message);
                } else {
                    console.log("Error alert email sent successfully");
                }
            });
        }
        callback();
    }
}


const createTransport = (level) => {
    return new winston.transports.DailyRotateFile({
        filename: `${level}-%DATE%.log`,
        dirname: logDir,
        level,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "10m",
        maxFiles: "14d",
    });
};


const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        telegramFormatter(), // 🔔 Send Telegram alert on error
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
            info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
        )
    ),
    transports: [
        createTransport("info"),
        createTransport("warn"),
        createTransport("error"),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new EmailTransport(), // 📬 Send error logs via email
    ],
});

const logWithUser = (req, level, message) => {
    try {
        const email = req?.user?.email || 'Guest';
        logger.log({
            level,
            message: `[User: ${email}] ${message}`,
        });
    } catch (e) {
        logger.error(`Logger failed: ${e.message}`);
    }
};

module.exports = {logger,logWithUser};
