import { createPartFromBase64, createUserContent, GoogleGenAI } from "@google/genai";   
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Image = Buffer.from(uint8Array).toString('base64');
    
    // Analyze the image using Ollama
    // const response = await ollama.generate({
    //   model: 'gemma3:latest',
    //   prompt: `What is in the photo?`,
    // //   prompt: `You are a Pokémon card sorting assistant. 
    // //   For each Pokémon card image, identify and return the following:
    // //    - Card Name 
    // //   - Card Number & Set (e.g., 4/102 from Base Set, or SV01/SV162 from Scarlet & Violet)
    // //   - Set Symbol (describe or name if identifiable)
    // //   - Rarity (Common, Uncommon, Rare, Holo Rare, Reverse Holo, EX, GX, V, VSTAR, Full Art, Secret Rare, etc.)
    // //   - Card Type (e.g., Pokémon, Trainer, Energy, and evolution stage if applicable)
    // //   - Condition (if visible: Mint, Near Mint, Played, Damaged)
      
    // //   Make sure to double check your answer before returning it.
    // //   If any detail is unclear or missing from the image, label it as "Unclear" and explain why.`,
    //   images: [base64Image],
    // });

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    // const imageUpload = await genAI.files.upload({
    //     file: image,
    // });
    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            createUserContent([`You are a Pokémon card sorting assistant. 
                For each Pokémon card image, identify and return the following:
                - Card Name 
                - Card Number & Set (e.g., 4/102 from Base Set, or SV01/SV162 from Scarlet & Violet)
                - Set Symbol (describe or name if identifiable)
                - Rarity (Common, Uncommon, Rare, Holo Rare, Reverse Holo, EX, GX, V, VSTAR, Full Art, Secret Rare, etc.)
                - Card Type (e.g., Pokémon, Trainer, Energy, and evolution stage if applicable)
                - Condition (if visible: Mint, Near Mint, Played, Damaged)
                
                Make sure to double check your answer before returning it.
                If any detail is unclear or missing from the image, label it as "Unclear" and explain why.`,
                createPartFromBase64(base64Image, 'image/jpeg'),
            ]),
        ]
    });
    const text = result.text;
    console.log(text);

    return new NextResponse(`${text}`);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
