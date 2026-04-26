export const config = {
    apiUrl: process.env.MCP_API_URL ?? 'http://localhost:3000',
    apiKey: process.env.MCP_API_KEY ?? '',
};
if (!config.apiKey) {
    console.error('MCP_API_KEY environment variable is required');
    process.exit(1);
}
