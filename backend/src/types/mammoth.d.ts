declare module 'mammoth' {
    function extractRawText(options: { path: string } | { buffer: Buffer }): Promise<{ value: string, messages: any[] }>;
    // Ajoutez d'autres fonctions de mammoth que vous pourriez utiliser
    export { extractRawText };
}