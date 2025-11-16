const { create } = require('ipfs-http-client');

class IPFSService {
  constructor() {
    // Initialize IPFS client with Infura or local node
    if (process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET) {
      const auth = 'Basic ' + Buffer.from(
        process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
      ).toString('base64');

      this.client = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: auth,
        },
      });
    } else {
      // Local IPFS node
      this.client = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http',
      });
    }
  }

  // Upload file to IPFS
  async uploadFile(fileBuffer, fileName) {
    try {
      const file = {
        path: fileName,
        content: fileBuffer,
      };

      const result = await this.client.add(file);

      return {
        hash: result.path,
        url: `https://ipfs.io/ipfs/${result.path}`,
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  // Upload JSON data to IPFS
  async uploadJSON(jsonData) {
    try {
      const buffer = Buffer.from(JSON.stringify(jsonData));
      const result = await this.client.add(buffer);

      return {
        hash: result.path,
        url: `https://ipfs.io/ipfs/${result.path}`,
      };
    } catch (error) {
      console.error('IPFS JSON upload error:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  // Retrieve file from IPFS
  async getFile(hash) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  // Pin file to ensure it stays on IPFS
  async pinFile(hash) {
    try {
      await this.client.pin.add(hash);
      return true;
    } catch (error) {
      console.error('IPFS pin error:', error);
      return false;
    }
  }

  // Unpin file from IPFS
  async unpinFile(hash) {
    try {
      await this.client.pin.rm(hash);
      return true;
    } catch (error) {
      console.error('IPFS unpin error:', error);
      return false;
    }
  }
}

module.exports = new IPFSService();
