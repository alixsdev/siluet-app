'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function FileUploader() {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <Image
          src="/images/silhouette.png"
          alt="Silhouette"
          width={200}
          height={400}
        />
      </div>

      <div className="border-dashed border-2 border-neutral-400 rounded-md p-4 text-center bg-[#D6CFC6]">
        <p className="mb-2">
          Glissez et déposez ou cliquez pour importer<br />de nouvelles tenues
        </p>
        <label className="cursor-pointer bg-[#4B3C2F] text-white py-2 px-4 rounded inline-block">
          Importer
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {previews.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`preview-${index}`}
              className="w-full object-cover rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
}