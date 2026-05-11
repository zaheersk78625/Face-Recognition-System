export interface FaceUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  descriptors: number[][]; // Store serialized Float32Array
  imagePath?: string;
  createdAt: any;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  name: string;
  timestamp: any;
  confidence: number;
  emotion?: string;
}

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised';
