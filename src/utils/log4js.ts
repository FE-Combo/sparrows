import log4js, {Log4js, LoggingEvent} from "log4js";
import path from "path";

export default class Logger {
    private logger: Log4js;
    constructor(){
        this.logger = log4js;
    }
    init(){
        this.logger.addLayout("default", ()=>{
            return (logEvent: LoggingEvent)=> {
                return `${logEvent.startTime.toISOString()} ${logEvent.level.levelStr} [${logEvent.categoryName}] ${JSON.stringify(logEvent.data)}`
            }
        })
        this.logger.configure({
            appenders: {
                default: {
                  type: 'dateFile',
                  maxLogSize: 10485760,
                  backups: 5,
                  numBackups: 7,
                  filename: path.resolve("logs", 'default.log'),
                  layout: { type: 'default' },
                },
                trace: {
                    type: 'dateFile',
                    maxLogSize: 10485760,
                    backups: 5,
                    numBackups: 7,
                    filename: path.resolve("logs", 'trace.log'),
                    layout: { type: 'default' },
                },
                error: {
                    type: 'dateFile',
                    maxLogSize: 10485760,
                    backups: 5,
                    numBackups: 7,
                    filename: path.resolve("logs", 'error.log'),
                    layout: { type: 'default' },
                },
            }, 
            categories: {
                default: {
                  appenders: ['default'],
                  level: 'info'
                },
                trace: {
                    appenders: ['trace'],
                    level: 'trace'
                },
                error: {
                    appenders: ['error'],
                    level: 'error'
                },
            },
        });
        return {
            logger: this.logger.getLogger('default'), 
            traceLogger: this.logger.getLogger("trace"),
            errorLogger: this.logger.getLogger("error")
        }
    }
}
