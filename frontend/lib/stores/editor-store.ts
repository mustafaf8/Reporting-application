import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  EditorState,
  Block,
  GlobalStyles,
  CanvasSize,
  EditorAction,
} from "@/types/block-editor";
import { blockEditorAPI, BlockEditorTemplate } from "@/lib/api/block-editor";

interface EditorStore extends EditorState {
  // Actions
  addBlock: (block: Block, position?: number) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  selectBlock: (blockId: string | null) => void;
  duplicateBlock: (blockId: string) => void;
  togglePreviewMode: () => void;
  updateGlobalStyles: (styles: Partial<GlobalStyles>) => void;
  undo: () => void;
  redo: () => void;
  saveTemplate: (
    name: string,
    description?: string
  ) => Promise<{ success: boolean; templateId?: string; error?: string }>;
  loadTemplate: (templateId: string) => Promise<{
    success: boolean;
    template?: BlockEditorTemplate;
    error?: string;
  }>;
  updateTemplate: (
    templateId: string,
    name: string,
    description?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteTemplate: (
    templateId: string
  ) => Promise<{ success: boolean; error?: string }>;
  listTemplates: () => Promise<{
    success: boolean;
    templates?: BlockEditorTemplate[];
    error?: string;
  }>;
  // Load editor state from a full template object (without fetching)
  loadTemplateFromData: (template: BlockEditorTemplate) => void;
  generatePreview: () => Promise<{
    success: boolean;
    html?: string;
    error?: string;
  }>;
  resetEditor: () => void;

  // Internal actions
  _addToHistory: (state: EditorState) => void;
  _canUndo: () => boolean;
  _canRedo: () => boolean;
}

const defaultGlobalStyles: GlobalStyles = {
  primaryColor: "#4f46e5",
  secondaryColor: "#7c3aed",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: 1.5,
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  borderRadius: 8,
  spacing: 16,
};

const defaultCanvasSize: CanvasSize = {
  width: 800,
  height: 1000,
  unit: "px",
};

const initialState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  isPreviewMode: false,
  isDirty: false,
  history: {
    past: [],
    present: {
      blocks: [],
      selectedBlockId: null,
      isPreviewMode: false,
      isDirty: false,
      history: {
        past: [],
        present: {
          blocks: [],
          selectedBlockId: null,
          isPreviewMode: false,
          isDirty: false,
          history: {} as any,
          globalStyles: defaultGlobalStyles,
          canvasSize: defaultCanvasSize,
        },
        future: [],
        maxHistorySize: 50,
      },
      globalStyles: defaultGlobalStyles,
      canvasSize: defaultCanvasSize,
    },
    future: [],
    maxHistorySize: 50,
  },
  globalStyles: defaultGlobalStyles,
  canvasSize: defaultCanvasSize,
};

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      addBlock: (block: Block, position?: number) => {
        set((state) => {
          const newBlocks = [...state.blocks];
          if (position !== undefined) {
            newBlocks.splice(position, 0, block);
          } else {
            newBlocks.push(block);
          }

          const newState = {
            ...state,
            blocks: newBlocks,
            isDirty: true,
            selectedBlockId: block.id,
          };

          get()._addToHistory(newState);
          return newState;
        });
      },

      removeBlock: (blockId: string) => {
        set((state) => {
          const newBlocks = state.blocks.filter(
            (block) => block.id !== blockId
          );
          const newSelectedBlockId =
            state.selectedBlockId === blockId ? null : state.selectedBlockId;

          const newState = {
            ...state,
            blocks: newBlocks,
            selectedBlockId: newSelectedBlockId,
            isDirty: true,
          };

          get()._addToHistory(newState);
          return newState;
        });
      },

      updateBlock: (blockId: string, updates: Partial<Block>) => {
        set((state) => {
          const newBlocks = state.blocks.map((block) =>
            block.id === blockId ? { ...block, ...updates } : block
          );

          const newState = {
            ...state,
            blocks: newBlocks,
            isDirty: true,
          };

          get()._addToHistory(newState);
          return newState;
        });
      },

      reorderBlocks: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newBlocks = [...state.blocks];
          const [movedBlock] = newBlocks.splice(fromIndex, 1);
          newBlocks.splice(toIndex, 0, movedBlock);

          const newState = {
            ...state,
            blocks: newBlocks,
            isDirty: true,
          };

          get()._addToHistory(newState);
          return newState;
        });
      },

      selectBlock: (blockId: string | null) => {
        set((state) => ({
          ...state,
          selectedBlockId: blockId,
        }));
      },

      duplicateBlock: (blockId: string) => {
        const { blocks } = get();
        const blockIndex = blocks.findIndex((block) => block.id === blockId);

        if (blockIndex !== -1) {
          const originalBlock = blocks[blockIndex];
          const duplicatedBlock: Block = {
            ...originalBlock,
            id: `block-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            metadata: {
              ...originalBlock.metadata,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          const newBlocks = [...blocks];
          newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);

          set({ blocks: newBlocks });
          get()._addToHistory({ ...get(), blocks: newBlocks });
        }
      },

      togglePreviewMode: () => {
        set((state) => ({
          ...state,
          isPreviewMode: !state.isPreviewMode,
        }));
      },

      updateGlobalStyles: (styles: Partial<GlobalStyles>) => {
        set((state) => {
          const newState = {
            ...state,
            globalStyles: { ...state.globalStyles, ...styles },
            isDirty: true,
          };

          get()._addToHistory(newState);
          return newState;
        });
      },

      undo: () => {
        const state = get();
        if (state._canUndo()) {
          const { past, present, future } = state.history;
          const previous = past[past.length - 1];
          const newPast = past.slice(0, past.length - 1);

          set({
            ...previous,
            history: {
              past: newPast,
              present: previous,
              future: [present, ...future],
              maxHistorySize: state.history.maxHistorySize,
            },
          });
        }
      },

      redo: () => {
        const state = get();
        if (state._canRedo()) {
          const { past, present, future } = state.history;
          const next = future[0];
          const newFuture = future.slice(1);

          set({
            ...next,
            history: {
              past: [...past, present],
              present: next,
              future: newFuture,
              maxHistorySize: state.history.maxHistorySize,
            },
          });
        }
      },

      saveTemplate: async (name: string, description?: string) => {
        try {
          const state = get();
          const result = await blockEditorAPI.saveTemplate({
            name,
            description,
            blocks: state.blocks,
            globalStyles: state.globalStyles,
            canvasSize: state.canvasSize,
          });

          if (result.success) {
            set({ isDirty: false });
            return { success: true, templateId: result.id };
          } else {
            return { success: false, error: result.message };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      loadTemplate: async (templateId: string) => {
        try {
          const template = await blockEditorAPI.loadTemplate(templateId);

          set({
            blocks: template.blocks,
            globalStyles: template.globalStyles,
            canvasSize: template.canvasSize,
            selectedBlockId: null,
            isDirty: false,
          });

          return { success: true, template };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      updateTemplate: async (
        templateId: string,
        name: string,
        description?: string
      ) => {
        try {
          const state = get();
          const result = await blockEditorAPI.updateTemplate(templateId, {
            name,
            description,
            blocks: state.blocks,
            globalStyles: state.globalStyles,
            canvasSize: state.canvasSize,
          });

          if (result.success) {
            set({ isDirty: false });
            return { success: true };
          } else {
            return { success: false, error: result.message };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      deleteTemplate: async (templateId: string) => {
        try {
          await blockEditorAPI.deleteTemplate(templateId);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      listTemplates: async () => {
        try {
          const templates = await blockEditorAPI.listTemplates();
          return { success: true, templates };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      loadTemplateFromData: (template: BlockEditorTemplate) => {
        const newPresent = {
          blocks: template.blocks ?? [],
          selectedBlockId: null,
          isPreviewMode: false,
          isDirty: false,
          history: {} as any,
          globalStyles: template.globalStyles ?? defaultGlobalStyles,
          canvasSize: template.canvasSize ?? defaultCanvasSize,
        } as EditorState;

        set(() => ({
          blocks: template.blocks ?? [],
          globalStyles: template.globalStyles ?? defaultGlobalStyles,
          canvasSize: template.canvasSize ?? defaultCanvasSize,
          selectedBlockId: null,
          isDirty: false,
          history: {
            past: [],
            present: newPresent as any,
            future: [],
            maxHistorySize: 50,
          },
        }));
      },

      generatePreview: async () => {
        try {
          const state = get();
          const result = await blockEditorAPI.generatePreview({
            templateId: "preview",
            blocks: state.blocks,
            globalStyles: state.globalStyles,
            canvasSize: state.canvasSize,
          });

          if (result.success) {
            return { success: true, html: result.html };
          } else {
            return { success: false, error: result.error };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          };
        }
      },

      resetEditor: () => {
        set(initialState);
      },

      _addToHistory: (state: EditorState) => {
        const currentState = get();
        const { past, present, future, maxHistorySize } = currentState.history;

        const newPast = [...past, present];
        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }

        set({
          ...state,
          history: {
            past: newPast,
            present: state,
            future: [],
            maxHistorySize,
          },
        });
      },

      _canUndo: () => {
        const state = get();
        return state.history.past.length > 0;
      },

      _canRedo: () => {
        const state = get();
        return state.history.future.length > 0;
      },
    }),
    {
      name: "editor-store",
    }
  )
);
