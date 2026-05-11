"use client";

import { useEffect, useMemo, useState } from "react";
import { getAsset, type Asset, type ChatMessage } from "@/lib/api";

type AssetMap = Record<string, Asset | null>;

export function useMessageAssets(messages: ChatMessage[]) {
  const [assetsById, setAssetsById] = useState<AssetMap>({});
  const [loadingAssetIds, setLoadingAssetIds] = useState<string[]>([]);

  const assetIds = useMemo(() => {
    const next = new Set<string>();
    messages.forEach((message) => {
      if (message.type === "ASSET" && message.assetId?.trim()) {
        next.add(message.assetId.trim());
      }
    });
    return Array.from(next);
  }, [messages]);

  useEffect(() => {
    const missingIds = assetIds.filter((assetId) => !(assetId in assetsById) && !loadingAssetIds.includes(assetId));
    if (missingIds.length === 0) {
      return;
    }

    let active = true;
    setLoadingAssetIds((current) => Array.from(new Set([...current, ...missingIds])));

    void Promise.all(
      missingIds.map(async (assetId) => {
        try {
          const asset = await getAsset(assetId);
          return [assetId, asset] as const;
        } catch {
          return [assetId, null] as const;
        }
      }),
    ).then((entries) => {
      if (!active) {
        return;
      }

      setAssetsById((current) => {
        const next = { ...current };
        entries.forEach(([assetId, asset]) => {
          next[assetId] = asset;
        });
        return next;
      });
      setLoadingAssetIds((current) => current.filter((assetId) => !missingIds.includes(assetId)));
    });

    return () => {
      active = false;
    };
  }, [assetIds, assetsById, loadingAssetIds]);

  return {
    assetsById,
    loadingAssetIds: new Set(loadingAssetIds),
  };
}
