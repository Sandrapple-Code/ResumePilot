import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, isMockFirebase } from "@/lib/firebase";

export const uploadResumeFile = async (uid: string, fileId: string, file: File): Promise<string> => {
  if (isMockFirebase) {
    return `mock-storage-url-for-${fileId}.pdf`;
  }
  const fileRef = ref(storage, `resumes/${uid}/${fileId}.pdf`);
  const snap = await uploadBytes(fileRef, file);
  return getDownloadURL(snap.ref);
};

export const deleteResumeFile = async (uid: string, fileId: string): Promise<void> => {
  if (isMockFirebase) {
    return;
  }
  const fileRef = ref(storage, `resumes/${uid}/${fileId}.pdf`);
  await deleteObject(fileRef);
};
