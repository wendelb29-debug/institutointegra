import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Converts a stored file reference (full URL or raw path) into the object path
 * inside the given bucket.
 */
export const toStoragePath = (bucket: string, urlOrPath: string): string => {
  const marker = `/${bucket}/`;
  if (urlOrPath.includes(marker)) {
    return urlOrPath.split(marker)[1].split('?')[0];
  }
  return urlOrPath.replace(/^\/+/, '');
};

/** Creates a temporary signed URL for a file stored in a private bucket. */
export const getSignedUrl = async (
  bucket: string,
  urlOrPath: string,
  expiresIn = 3600,
): Promise<string | null> => {
  const path = toStoragePath(bucket, urlOrPath);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
};

/**
 * Resolves a stored reference to a viewable URL. References that don't belong to
 * the bucket (e.g. external provider URLs) are returned untouched.
 */
export const resolveFileUrl = async (
  bucket: string,
  urlOrPath: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> => {
  if (!urlOrPath) return null;
  const isExternal = /^https?:\/\//.test(urlOrPath) && !urlOrPath.includes(`/${bucket}/`);
  if (isExternal) return urlOrPath;
  return getSignedUrl(bucket, urlOrPath, expiresIn);
};

/** React helper that resolves a private-bucket reference to a signed URL. */
export const useSignedUrl = (
  bucket: string,
  urlOrPath: string | null | undefined,
  expiresIn = 3600,
) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!urlOrPath) {
      setUrl(null);
      return;
    }
    // Local blob/data URLs are already usable
    if (urlOrPath.startsWith('blob:') || urlOrPath.startsWith('data:')) {
      setUrl(urlOrPath);
      return;
    }
    resolveFileUrl(bucket, urlOrPath, expiresIn).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [bucket, urlOrPath, expiresIn]);

  return url;
};
