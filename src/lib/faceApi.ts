import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export async function loadModels() {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  ]);
}

export async function getFaceDescriptors(input: HTMLVideoElement | HTMLImageElement) {
  const detections = await faceapi.detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions();
  
  return detections;
}

export function createFaceMatcher(users: { name: string, descriptors: number[][] }[]) {
  const labeledDescriptors = users.map(user => {
    const descriptors = user.descriptors.map(d => new Float32Array(d));
    return new faceapi.LabeledFaceDescriptors(user.name, descriptors);
  });

  return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is threshold
}
