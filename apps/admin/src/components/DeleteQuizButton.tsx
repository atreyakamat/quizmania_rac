'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteQuizButtonProps {
  quizId: string;
  quizTitle: string;
  className?: string;
  redirectAfterDelete?: string;
}

export function DeleteQuizButton({
  quizId,
  quizTitle,
  className,
  redirectAfterDelete
}: DeleteQuizButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${quizTitle}"?\n\nThis action cannot be undone and will permanently remove all questions and participant answers.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Failed to delete quiz: ${data.error || 'Unknown error'}`);
        return;
      }

      if (redirectAfterDelete) {
        router.push(redirectAfterDelete);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(`Error deleting quiz: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Delete quiz ${quizTitle}`}
      className={
        className ||
        'text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-1 disabled:opacity-50 transition-colors'
      }
    >
      {isDeleting ? (
        <Loader2 className="w-3 h-3 animate-spin text-red-500" />
      ) : (
        <Trash2 className="w-3 h-3 text-red-500" />
      )}
      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
    </button>
  );
}
