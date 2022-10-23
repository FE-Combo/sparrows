import crypto from 'crypto';

/**
 * 密钥轮转
 * 1. 密钥数组前面必须有个十六进制自增数字版本，且版本号在数组中是唯一的，密钥数组长度固定34字符
 * 2. 密钥轮转可以随时新增密钥，但是不能修改原来的密钥
 * 3. 每次加密都是使用最新的密钥，如果解密过程中未找到最新密钥需重refreshSecrets重新获取密钥数组
 * 4. 使用crypto.createCipheriv aes-256-gcm算法
 */

type RefreshSecretsFunc = () => Promise<{
    secrets: string;
  }>;

interface EncryptOptions {
    secrets: string;
    refreshSecrets?: RefreshSecretsFunc
}

export default class Crypto {
    private secrets: string[];
    refreshSecrets: RefreshSecretsFunc | null;
    private algorithm = 'aes-256-gcm' as const;
    private secretLength = 32;  // 秘钥长度，aes-256-gcm 算法下固定长度
    private versionLength = 2;   // 秘钥版本长度
    private randomLength = 32;  // 随机字符串长度
    private authTagLength = 32;  // authTag字符串长度，aes-256-gcm 算法下固定长度

    constructor(opt: EncryptOptions) {
        const { secrets, refreshSecrets } = opt;
        this.refreshSecrets = refreshSecrets ? refreshSecrets : null;
        const parsedSecrets = this.parseSecrets(secrets);
        if (!parsedSecrets) {
          throw new Error('Invalid secrets');
        }
        this.secrets = parsedSecrets;
    }

    // 校验secrets并格式化
    parseSecrets = (secrets: string) => {
        if (!secrets || typeof secrets !== 'string') return null;

        const result = secrets.split(',').map(_ => {
          const version = _.substr(0, this.versionLength);
          const num = parseInt(`0x${version}`);
          if (isNaN(num) || num < 0 || _.length !== this.versionLength + this.secretLength) return '';
          return _;
        }).filter (_ => typeof _ === 'string' && !!_);

        if (!result || result.length <= 0) return null;
        return result;
    }

    // 生成的密文格式： 2位密钥版本号 + 32位随机字符串(iv) + 32位authtag + 密文
    encrypt = (data: string): string | null => {
        try {
            if (!data || typeof data !== 'string') return null;

            // 加密始终使用最新版秘钥
            const lastSecret = this.secrets[this.secrets.length-1];

            const versionInSecret = lastSecret.substr(0, this.versionLength); 

            const realSecret = lastSecret.substring(this.versionLength);

            // 生成随机字节(randomLength字符)，它是一个初始化向量
            const iv = crypto.randomBytes(this.randomLength/2).toString('hex');

            const cipher = crypto.createCipheriv(this.algorithm, realSecret, iv);

            // 密文
            let restSecret = cipher.update(data, 'utf8', 'hex');
            restSecret += cipher.final('hex');

            // 32位, aes-256-gcm 算法下固定长度
            const authTag = cipher.getAuthTag().toString('hex');

            return `${versionInSecret}${iv}${authTag}${restSecret}`;
        } catch (e: any) {
            throw new Error(e);
        }
    }

    decrypt = async (ciphertext: string, refresh: boolean = false): Promise<string | null> => {
        try {
            if (!ciphertext && typeof ciphertext !== 'string') return null;
            // 获取 2位密钥版本号 + 32位随机字符串 + 32位authtag
            const prefix = ciphertext.substring(0, this.versionLength + this.randomLength + this.authTagLength);

            // 解密需要根据密文前缀, 寻找加密秘钥
            const version = prefix.substring(0, this.versionLength);

            const secret = this.secrets.find(_ => _ && _.indexOf(version) === 0);

            if (!secret) {
                // 取最新的密钥
                if(refresh) {
                    if (!this.refreshSecrets) return null;
                    const { secrets } = await this.refreshSecrets();
                    const parsedSecrets = this.parseSecrets(secrets);
                    if (!parsedSecrets) return null;
                    this.secrets = [...new Set(this.secrets.concat(parsedSecrets))];
                    return await this.decrypt(ciphertext, false);
                }
                return null
            };

            const realSecret = secret.substring(this.versionLength);

            const iv = prefix.substr(this.versionLength, this.randomLength);

            const authtag = prefix.substr(this.versionLength + this.randomLength, this.authTagLength);
            
            const restSecret = ciphertext.substr(this.versionLength + this.randomLength + this.authTagLength);

            const cipher = crypto.createDecipheriv(this.algorithm, realSecret, iv);

            cipher.setAuthTag(Buffer.from(authtag, 'hex'));

            let data = cipher.update(restSecret, 'hex', 'utf8');
            data += cipher.final('utf8');

            return data;
        } catch (e: any) {
            throw new Error(e);
        }
    }
}