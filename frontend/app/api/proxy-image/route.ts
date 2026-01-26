import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get('path');

    if (!imagePath) {
        return new NextResponse('Missing image path', { status: 400 });
    }

    try {
        const imageUrl = `${API_URL}${imagePath}`;
        
        const response = await fetch(imageUrl, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
            },
        });

        if (!response.ok) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new NextResponse('Error loading image', { status: 500 });
    }
}
