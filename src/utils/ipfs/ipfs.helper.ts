import fetch from 'node-fetch'
import { ipfsBaseUrl } from './ipfs.const'
import * as fs from 'fs'
import FormData from 'form-data';

const defaultBaseurl = `${ipfsBaseUrl}/api/v0`;

export default class TernoaIpfsApi {
    baseUrl = defaultBaseurl;
    constructor() {
    }
    async addFile(data: any, fileName: string) {
        try {
            fs.writeFileSync(fileName, JSON.stringify(data))
            const stream = fs.createReadStream(fileName)
            const formData = new FormData();
            formData.append('file', stream as any);
            const response = await fetch(`${this.baseUrl}/add`, {
                method: 'POST',
                body: formData,
            })
            if (!response.ok) throw new Error ("Invalid IPFS response")
            return await response.json()
        } catch (e) {
            console.error('addFile error', e)
            throw new Error(e as string);
        } finally {
            try{
                if (fs.existsSync(fileName)) {
                    fs.unlinkSync(fileName)
                }
            }catch(err){
                throw err
            }
        }
    }
}