import React, { useState } from 'react';
import { MapPin, AlertCircle, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CommentModal } from './CommentModal';

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_name?: string;
  user_image_url?: string;
}

interface WildlifeCardProps {
  id: string;
  speciesName: string;
  description: string | null;
  conservationStatus: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  municipalityName: string;
  municipalityImageUrl: string | null;
  comments?: Comment[];
  onAddComment: (wildlifeId: string, commentText: string) => void | Promise<void>;
  onViewProfile?: (profileId: string) => void;
}

export const WildlifeCard: React.FC<WildlifeCardProps> = ({
  id,
  speciesName,
  description,
  conservationStatus,
  imageUrl,
  imageUrls,
  municipalityName,
  municipalityImageUrl,
  comments = [],
  onAddComment,
  onViewProfile,
}) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Critically Endangered':
        return 'bg-red-100 text-red-700';
      case 'Endangered':
        return 'bg-orange-100 text-orange-700';
      case 'Vulnerable':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <motion.div
        className="group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative h-56 bg-black/10 overflow-hidden">
          <img
            src={imageUrl || 'https://via.placeholder.com/400x300?text=Wildlife'}
            alt={speciesName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Conservation Status Badge */}
          {conservationStatus && (
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(conservationStatus)}`}>
              {conservationStatus}
            </div>
          )}

          {/* Comments Count Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-black" />
            <span className="text-sm font-semibold text-black">{comments.length}</span>
          </div>

          {/* Add Comment Button Overlay */}
          <motion.button
            type="button"
            onClick={() => setIsCommentModalOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer group"
          >
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-white mx-auto mb-2" />
              <span className="text-white font-semibold">Add Comment</span>
            </div>
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Species Name */}
          <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">{speciesName}</h3>

          {/* Description */}
          {description && (
            <p className="text-black/60 text-sm mb-4 line-clamp-2">{description}</p>
          )}

          {/* Municipality Info */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-black/5 rounded-lg">
            {municipalityImageUrl && (
              <img
                src={municipalityImageUrl}
                alt={municipalityName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-black/60">Uploaded by</p>
              <p className="text-sm font-semibold text-black truncate">{municipalityName}</p>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              This species requires protective conservation measures
            </p>
          </div>

          {/* Recent Comments Section */}
          {comments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({comments.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>

              {showComments && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.slice(0, 5).map((comment) => (
                    <div key={comment.id} className="bg-black/5 rounded p-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.user_image_url && (
                          <img
                            src={comment.user_image_url}
                            alt={comment.user_name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        <span className="font-semibold text-black/80">{comment.user_name}</span>
                        <span className="text-black/50">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-black/70 line-clamp-2">{comment.comment_text}</p>
                    </div>
                  ))}
                  {comments.length > 5 && (
                    <button
                      type="button"
                      className="w-full text-xs text-green-600 hover:text-green-700 font-medium py-1 transition-colors"
                    >
                      View all {comments.length} comments
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Comment Modal */}
      <CommentModal
        open={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title={`Comment on ${speciesName}`}
        onSubmit={(comment) => {
          onAddComment(id, comment);
          setIsCommentModalOpen(false);
        }}
      />
    </>
  );
};
