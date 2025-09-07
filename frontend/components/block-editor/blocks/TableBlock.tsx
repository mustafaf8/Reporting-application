import React, { useState } from "react";
import { Block } from "@/types/block-editor";
import { BaseBlock } from "./BaseBlock";
import { useEditorStore } from "@/lib/stores/editor-store";

interface TableBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  isSelected,
  isPreviewMode,
}) => {
  const { updateBlock } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const tableData = block.content.tableData;

  const handleCellEdit = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    if (!tableData) return;

    const newRows = [...tableData.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;

    updateBlock(block.id, {
      content: {
        ...block.content,
        tableData: {
          ...tableData,
          rows: newRows,
        },
      },
      metadata: { ...block.metadata, updatedAt: new Date().toISOString() },
    });
  };

  const handleHeaderEdit = (colIndex: number, value: string) => {
    if (!tableData) return;

    const newHeaders = [...tableData.headers];
    newHeaders[colIndex] = value;

    updateBlock(block.id, {
      content: {
        ...block.content,
        tableData: {
          ...tableData,
          headers: newHeaders,
        },
      },
      metadata: { ...block.metadata, updatedAt: new Date().toISOString() },
    });
  };

  if (!tableData) {
    return (
      <BaseBlock
        block={block}
        isSelected={isSelected}
        isPreviewMode={isPreviewMode}
      >
        <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
          <div className="text-center text-slate-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z"
              />
            </svg>
            <p className="text-sm">Tablo bloğu</p>
            <p className="text-xs">Tablo verisi yok</p>
          </div>
        </div>
      </BaseBlock>
    );
  }

  return (
    <BaseBlock
      block={block}
      isSelected={isSelected}
      isPreviewMode={isPreviewMode}
    >
      <div className="w-full overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{
            fontSize: block.styles.fontSize,
            color: block.styles.color,
          }}
        >
          {tableData.hasHeader && (
            <thead>
              <tr className="bg-slate-50">
                {tableData.headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="border border-slate-200 px-3 py-2 text-left font-medium"
                  >
                    {isEditing && !isPreviewMode ? (
                      <input
                        type="text"
                        value={header}
                        onChange={(e) =>
                          handleHeaderEdit(colIndex, e.target.value)
                        }
                        onBlur={() => setIsEditing(false)}
                        className="w-full border-none outline-none bg-transparent"
                        autoFocus
                      />
                    ) : (
                      <span
                        onDoubleClick={() =>
                          !isPreviewMode && setIsEditing(true)
                        }
                        className="cursor-pointer"
                      >
                        {header}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  tableData.isStriped && rowIndex % 2 === 1 ? "bg-slate-50" : ""
                }
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-slate-200 px-3 py-2"
                  >
                    {isEditing && !isPreviewMode ? (
                      <input
                        type="text"
                        value={String(cell)}
                        onChange={(e) =>
                          handleCellEdit(rowIndex, colIndex, e.target.value)
                        }
                        onBlur={() => setIsEditing(false)}
                        className="w-full border-none outline-none bg-transparent"
                      />
                    ) : (
                      <span
                        onDoubleClick={() =>
                          !isPreviewMode && setIsEditing(true)
                        }
                        className="cursor-pointer"
                      >
                        {cell}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaseBlock>
  );
};
