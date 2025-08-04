import React, { useState, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Code2,
    Undo,
    Redo,
    Link2,
    Link2Off
} from 'lucide-react';

function LinkToolbar({ editor, activeMarks, buttonStyle, isActive }: any) {
    const [showInput, setShowInput] = useState(false);
    const [url, setUrl] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Autofocus input when it opens
    useEffect(() => {
        if (showInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showInput]);

    // When clicking outside input box, close it
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (inputRef.current && !inputRef.current!.contains(event.target)) {
                setShowInput(false);
            }
        }
        if (showInput) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showInput]);

    function addLink() {
        if (!url) return;
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        setShowInput(false);
        setUrl('');
    }

    return (
        <div className="flex relative rounded">
            <button
                type="button"
                onClick={() => {
                    if (showInput) {
                        addLink();
                    } else {
                        setShowInput(true);
                    }
                }}
                className={`${buttonStyle} ${isActive(activeMarks.link)} rounded-none rounded-l border-r-0`}
                title="Add/Edit Link"
                aria-label="Add or edit link"
            >
                <Link2 className="w-4 h-4" />
            </button>

            {showInput && (
                <div
                    ref={inputRef}
                    className="absolute z-10 top-full mt-1 left-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow p-2 flex gap-2 items-center"
                    style={{ minWidth: '220px' }}
                >
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter URL..."
                        className="flex-grow px-1 h-6 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') addLink();
                            if (e.key === 'Escape') setShowInput(false);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => addLink()}
                        className="flex items-center justify-center w-6 h-6 text-sm font-semibold text-white bg-orange-500 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        aria-label="Add link"
                    >
                        <Link2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowInput(false);
                            setUrl('');
                        }}
                        className="flex items-center justify-center w-3 h-3 text-sm font-semibold text-red-500 rounded hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Cancel adding link"
                    >
                        ✕
                    </button>
                </div>
            )}

            <button
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                className={buttonStyle + " rounded-none rounded-r"}
                title="Remove Link"
                aria-label="Remove link"
            >
                <Link2Off className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function DescriptionEditor({ eventData, setEventData }: any) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: 'Describe the volunteer opportunity...',
            }),
            Link.configure({
                openOnClick: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
        ],
        content: eventData.description || '',
        onUpdate({ editor }) {
            setEventData({ ...eventData, description: editor.getHTML() });
        },
    });

    const [activeMarks, setActiveMarks] = useState({
        bold: false,
        italic: false,
        underline: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        link: false
    });

    function updateActiveStates() {
        if (!editor) return;
        setActiveMarks({
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            bulletList: editor.isActive('bulletList'),
            orderedList: editor.isActive('orderedList'),
            blockquote: editor.isActive('blockquote'),
            codeBlock: editor.isActive('codeBlock'),
            link: editor.isActive('link')
        });
    }

    useEffect(() => {
        if (!editor) return;

        // Update active states initially and on every transaction
        updateActiveStates();

        editor.on('selectionUpdate', updateActiveStates);
        editor.on('transaction', updateActiveStates);

        return () => {
            editor.off('selectionUpdate', updateActiveStates);
            editor.off('transaction', updateActiveStates);
        };
    }, [editor]);

    if (!editor) return null;

    const buttonStyle =
        'w-6 h-6 flex justify-center items-center text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-400';

    const isActive = (state: boolean) =>
        state ? 'bg-slate-300 dark:bg-slate-700' : '';

    return (
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
            </label>

            <div className="mb-2 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.bold)}`}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.italic)}`}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.underline)}`}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.bulletList)}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.orderedList)}`}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.blockquote)}`}
                    title="Blockquote"
                >
                    <Quote className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`${buttonStyle} ${isActive(activeMarks.codeBlock)}`}
                    title="Code Block"
                >
                    <Code2 className="w-4 h-4" />
                </button>

                <LinkToolbar
                    editor={editor}
                    activeMarks={activeMarks}
                    buttonStyle={buttonStyle}
                    isActive={isActive}
                />

                <div className="flex flex-row">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        className={buttonStyle + " rounded-none rounded-l border-r-0"}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        className={buttonStyle + " rounded-none rounded-r"}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="min-h-xl">
                <EditorContent editor={editor} content={"test"} />
            </div>
        </div>
    );
}