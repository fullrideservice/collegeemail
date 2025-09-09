import React, { useState } from "react";

const UUIDGenerator = () => {
  const [generatedUUIDs, setGeneratedUUIDs] = useState([]);
  const [count, setCount] = useState(5);

  const generateUUIDs = () => {
    const newUUIDs = [];
    for (let i = 0; i < count; i++) {
      newUUIDs.push(crypto.randomUUID());
    }
    setGeneratedUUIDs(newUUIDs);
  };

  const copyToClipboard = (uuid) => {
    navigator.clipboard.writeText(uuid);
  };

  const copyAllToClipboard = () => {
    const allUUIDs = generatedUUIDs.join("\n");
    navigator.clipboard.writeText(allUUIDs);
  };

  const clearUUIDs = () => {
    setGeneratedUUIDs([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          UUID Generator
        </h2>
        <p className="text-gray-600">
          Generate cryptographically secure UUID v4 strings using
          crypto.randomUUID()
        </p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="count" className="text-sm font-medium text-gray-700">
            Count:
          </label>
          <input
            id="count"
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={generateUUIDs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          Generate UUIDs
        </button>

        {generatedUUIDs.length > 0 && (
          <>
            <button
              onClick={copyAllToClipboard}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              Copy All
            </button>
            <button
              onClick={clearUUIDs}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {generatedUUIDs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Generated UUIDs ({generatedUUIDs.length}):
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {generatedUUIDs.map((uuid, index) => (
              <div
                key={uuid}
                className="flex items-center justify-between py-2 px-3 mb-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono w-6">
                    {index + 1}.
                  </span>
                  <span className="font-mono text-sm text-gray-800 select-all">
                    {uuid}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(uuid)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p>
              <strong>Format:</strong> xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            </p>
            <p>
              <strong>Length:</strong> 36 characters (including hyphens)
            </p>
            <p>
              <strong>Version:</strong> UUID v4 (random, cryptographically
              secure)
            </p>
          </div>
        </div>
      )}

      {generatedUUIDs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Click "Generate UUIDs" to create new UUID v4 strings
        </div>
      )}
    </div>
  );
};

export default UUIDGenerator;
