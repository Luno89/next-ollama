export async function analyzeImage(imagePath: string) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:latest',
        prompt: `Analyze this image and provide a detailed description including:
        1. Main subject and its characteristics
        2. Background elements and setting
        3. Colors and lighting
        4. Overall composition and mood
        5. Any notable details or features

        <image>${imagePath}</image>`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
