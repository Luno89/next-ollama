"use client"

export async function analyzeImageAction(image: File) {
  try {
    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
