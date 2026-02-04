import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";

interface UsePhotoPickerOptions {
  maxPhotos?: number;
  aspect?: [number, number];
  quality?: number;
}

interface PickedImage {
  uri: string;
  base64?: string;
  mimeType?: string;
}

interface UsePhotoPickerReturn {
  pickImage: () => Promise<PickedImage | null>;
  uploadPhoto: (image: PickedImage | string) => Promise<string>;
  uploadPhotos: (images: Array<PickedImage | string>) => Promise<string[]>;
}

export function usePhotoPicker(options: UsePhotoPickerOptions = {}): UsePhotoPickerReturn {
  const { maxPhotos = 6, aspect = [3, 4], quality = 0.8 } = options;

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const pickImage = useCallback(async (): Promise<PickedImage | null> => {
    hapticSelection();

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      hapticButtonPress();
      const asset = result.assets[0];
      return { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType };
    }

    return null;
  }, [aspect, quality]);

  const uploadPhoto = useCallback(async (image: PickedImage | string): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const uri = typeof image === "string" ? image : image.uri;
    const mimeType = typeof image === "string" ? "image/jpeg" : image.mimeType || "image/jpeg";
    let base64 = typeof image === "string" ? undefined : image.base64;
    if (!base64) {
      base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    }

    const base64ToUint8Array = (data: string) => {
      const cleaned = data.replace(/[\r\n]+/g, "");
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i += 1) {
        lookup[chars.charCodeAt(i)] = i;
      }
      let bufferLength = cleaned.length * 0.75;
      if (cleaned.endsWith("==")) bufferLength -= 2;
      else if (cleaned.endsWith("=")) bufferLength -= 1;
      const bytes = new Uint8Array(bufferLength);
      let p = 0;
      for (let i = 0; i < cleaned.length; i += 4) {
        const encoded1 = lookup[cleaned.charCodeAt(i)];
        const encoded2 = lookup[cleaned.charCodeAt(i + 1)];
        const encoded3 = lookup[cleaned.charCodeAt(i + 2)];
        const encoded4 = lookup[cleaned.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (cleaned[i + 2] !== "=") {
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        }
        if (cleaned[i + 3] !== "=") {
          bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
        }
      }
      return bytes;
    };

    const bytes = base64ToUint8Array(base64);
    const { storageId } = await new Promise<{ storageId: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Content-Type", mimeType);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new Error("Invalid JSON response from upload"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new TypeError("Network request failed"));
      xhr.send(bytes);
    });

    return storageId;
  }, [generateUploadUrl]);

  const uploadPhotos = useCallback(
    (images: Array<PickedImage | string>): Promise<string[]> => Promise.all(images.map(uploadPhoto)),
    [uploadPhoto]
  );

  return { pickImage, uploadPhoto, uploadPhotos };
}
