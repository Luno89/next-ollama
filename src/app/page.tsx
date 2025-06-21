
"use client";
import { useState, useRef, useEffect } from 'react';
import { analyzeImageAction } from './actions';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [height, setHeight] = useState(0);
  const width = 320;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !photoRef.current || !startButtonRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const startButton = startButtonRef.current;

    const constraints = {
      video: true,
      audio: false,
    };

    // Check if we're in a frame
    if (window.self !== window.top) {
      startButton.textContent = 'Open example in new window';
      startButton.addEventListener('click', () => {
        window.open(
          location.href,
          'MDN',
          'width=850,height=700,left=150,top=150',
        );
      });
      return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        alert('Failed to access camera. Please check permissions and try again.');
      });

    video.addEventListener('canplay', () => {
      if (!streaming) {
        // Calculate height based on aspect ratio
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        setHeight(videoHeight / (videoWidth / width));

        // Firefox has a bug where height can't be read
        if (isNaN(height)) {
          setHeight(width / (4 / 3));
        }

        video.setAttribute('width', width.toString());
        video.setAttribute('height', height.toString());
        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());
        setStreaming(true);
      }
    });

    startButton.addEventListener('click', takePicture);

    // Cleanup on unmount
    return () => {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      video.removeEventListener('canplay', () => {});
      startButton.removeEventListener('click', takePicture);
    };
  }, []);

  const takePicture = () => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    if (!canvas || !photo) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      const video = videoRef.current;
      if (video) {
        context.drawImage(video, 0, 0, width, height);
        const data = canvas.toDataURL('image/jpeg');
        photo.src = data;

        // Convert to File object
        const blob = dataURLToBlob(data);
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        setImage(file);
      }
    }
  };

  const dataURLToBlob = (dataURL: string) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    try {
      // Analyze the image using server action
      const result = await analyzeImageAction(image);
      setAnalysis(result);
    } catch (error) {
      console.error('Error:', error);
      setAnalysis('Error analyzing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image Analysis with Ollama</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="space-y-4">
            <div>
              <div className="flex flex-col gap-4">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg border border-gray-200"
                  autoPlay
                  playsInline
                />
                <button
                  ref={startButtonRef}
                  onClick={takePicture}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Take Photo
                </button>
                <canvas ref={canvasRef} className="hidden" />
                <div className="mt-4">
                  <img
                    ref={photoRef}
                    className="w-full rounded-lg border border-gray-200"
                    alt="Captured photo"
                  />
                </div>
              </div>
              <canvas ref={canvasRef} id="canvas" />
              <div>
                <img ref={photoRef} id="photo" />
              </div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Upload an image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 block w-full"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!image || loading}
              className="
                px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                disabled:bg-gray-400 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Image Analysis</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-gray-700">
                {analysis}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

