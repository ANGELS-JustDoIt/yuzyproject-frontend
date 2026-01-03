"use client";
import { useState, useEffect } from "react";
import type React from "react";
import { useSearchParams } from "next/navigation";
import {
  Code2,
  Search,
  X,
  Heart,
  MessageCircle,
  Eye,
  Plus,
  MoreHorizontal,
  Bookmark,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { postApi, myApi } from "@/lib/api";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Post {
  boardId: number;
  title: string;
  type: "community" | "question";
  content: string;
  userId: string | number; // user_idx일 수도 있음
  userIdx?: number; // 실제 user_idx
  userName?: string; // 사용자 이름
  name?: string; // 사용자 이름 (DB 필드명)
  profileImageUrl?: string; // 프로필 이미지 URL
  profile_image_url?: string; // 프로필 이미지 URL (스네이크 케이스)
  createdAt: string;
  updatedAt: string;
  mainImageId?: number;
  views: number;
  isSolved: boolean;
  likeCount: number;
  commentCount?: number; // 댓글 수
}

interface Comment {
  replyId: number;
  boardId: number;
  seq: number;
  reply: string; // 백엔드에서 reply 필드로 반환
  content?: string; // 호환성을 위해 유지
  userId: string | number;
  userIdx?: number; // 실제 user_idx
  userName?: string; // 사용자 이름
  name?: string; // 사용자 이름 (DB 필드명)
  createdAt: string;
  updatedAt: string;
  isSelected: boolean;
}

interface FileAttachment {
  boardType: string;
  boardId: number;
  filePath: string;
  fileName: string;
  seq: number;
  userId: string;
  fileKey: number;
  createdAt: string;
  isMainImage?: boolean;
}

export default function PostsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"community" | "question">(
    "community"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [postImages, setPostImages] = useState<Map<number, string>>(new Map()); // 게시글 ID -> 메인 이미지 URL
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostFiles, setSelectedPostFiles] = useState<FileAttachment[]>(
    []
  );
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>(
    []
  );
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [commentText, setCommentText] = useState<{ [key: number]: string }>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<{
    [key: number]: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Map<number, number>>(
    new Map()
  ); // 게시글 ID -> 댓글 수

  const postsPerPage = activeTab === "community" ? 9 : 15;

  // 현재 사용자 정보 및 스크랩 목록 조회
  useEffect(() => {
    const fetchCurrentUserAndScraps = async () => {
      try {
        const [profileResponse, scrapsResponse] = await Promise.all([
          myApi.getProfile(),
          myApi.getScraps(),
        ]);
        setCurrentUserId(profileResponse.profile.userIdx || null);

        // 스크랩된 게시글 ID 목록 설정
        if (scrapsResponse.scraps && Array.isArray(scrapsResponse.scraps)) {
          const scrapedBoardIds = new Set(
            scrapsResponse.scraps.map(
              (scrap: any) => scrap.boardId || scrap.board_id
            )
          );
          setSavedPosts(scrapedBoardIds);
        }
      } catch (err) {
        console.error("사용자 정보 및 스크랩 조회 실패:", err);
      }
    };
    fetchCurrentUserAndScraps();
  }, []);

  // URL 쿼리 파라미터에서 postId를 읽어서 해당 게시글 자동으로 열기
  useEffect(() => {
    const postIdParam = searchParams.get("postId");
    if (postIdParam && !loading) {
      const postId = parseInt(postIdParam);
      if (!isNaN(postId)) {
        // 게시글 목록에서 해당 게시글 찾기
        const post = posts.find((p) => p.boardId === postId);
        if (post) {
          viewPost(post);
        } else {
          // 목록에 없으면 직접 조회
          const loadPost = async () => {
            try {
              const postDetail = await postApi.getPost(postId);
              viewPost(postDetail.post);
            } catch (err) {
              console.error("게시글 조회 실패:", err);
            }
          };
          loadPost();
        }
        // URL에서 postId 파라미터 제거
        window.history.replaceState({}, "", "/posts");
      }
    }
  }, [searchParams, posts, loading]);

  // 게시글 목록 조회
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const limit = postsPerPage;
      const response = await postApi.getPosts({
        page: currentPage,
        limit,
        type: activeTab,
        keyword: searchQuery || undefined,
      });
      setPosts(response.posts);
      setPagination(response.pagination);

      // 각 게시글의 댓글 수 및 좋아요 상태 조회
      const postDetailPromises = response.posts.map(async (post: Post) => {
        try {
          const [commentsResponse, likeResponse] = await Promise.all([
            postApi
              .getComments(post.boardId)
              .catch(() => ({ comments: [], commentCount: 0 })),
            postApi
              .getLikeStatus(post.boardId)
              .catch(() => ({ isLiked: false, likeCount: 0 })),
          ]);
          return {
            postId: post.boardId,
            commentCount:
              commentsResponse.commentCount ||
              commentsResponse.comments?.length ||
              0,
            isLiked: likeResponse.isLiked || false,
          };
        } catch (err) {
          console.error(`게시글 ${post.boardId} 상세 정보 조회 실패:`, err);
          return { postId: post.boardId, commentCount: 0, isLiked: false };
        }
      });

      const postDetailResults = await Promise.all(postDetailPromises);
      const newCommentCounts = new Map<number, number>();
      const newLikedPosts = new Set<number>();

      postDetailResults.forEach((result) => {
        newCommentCounts.set(result.postId, result.commentCount);
        if (result.isLiked) {
          newLikedPosts.add(result.postId);
        }
      });

      setCommentCounts(newCommentCounts);
      setLikedPosts(newLikedPosts);

      // 각 게시글의 메인 이미지 파일 정보 조회
      const postsWithMainImages = response.posts.filter(
        (post: Post) => post.mainImageId
      );
      if (postsWithMainImages.length > 0) {
        const imagePromises = postsWithMainImages.map(async (post: Post) => {
          try {
            const postDetail = await postApi.getPost(post.boardId);
            const mainFile = postDetail.files?.find(
              (f: FileAttachment) =>
                f.fileKey === post.mainImageId && f.isMainImage
            );
            if (mainFile) {
              return {
                postId: post.boardId,
                imageUrl: `${API_BASE_URL}${mainFile.filePath}`,
              };
            }
          } catch (err) {
            console.error(`게시글 ${post.boardId} 이미지 조회 실패:`, err);
          }
          return null;
        });

        const imageResults = await Promise.all(imagePromises);
        const newImageMap = new Map<number, string>();
        imageResults.forEach((result) => {
          if (result) {
            newImageMap.set(result.postId, result.imageUrl);
          }
        });
        setPostImages(newImageMap);
      }
    } catch (err: any) {
      setError(err.message || "게시글을 불러오는데 실패했습니다.");
      console.error("게시글 조회 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  // 게시글 상세 조회 (백그라운드에서 실행)
  const fetchPostDetail = async (postId: number) => {
    try {
      // 병렬로 게시글 상세와 좋아요 상태만 조회 (댓글은 이미 로드됨)
      const [postResponse, likeResponse] = await Promise.all([
        postApi.getPost(postId),
        postApi.getLikeStatus(postId),
      ]);

      setSelectedPost(postResponse.post);
      setSelectedPostFiles(postResponse.files || []);

      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (likeResponse.isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    } catch (err: any) {
      console.error("게시글 상세 조회 에러:", err);
      // 에러가 발생해도 사용자에게 알리지 않음 (댓글은 이미 표시됨)
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, currentPage, searchQuery]);

  const handleSearch = () => {
    const trimmedQuery = searchInput.trim();
    setSearchQuery(trimmedQuery);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleTabChange = (tab: "community" | "question") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await postApi.toggleLike(postId);
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (response.isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      // 목록의 좋아요 개수 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.boardId === postId
            ? { ...post, likeCount: response.likeCount }
            : post
        )
      );
      // 상세보기 모달이 열려있으면 업데이트
      if (selectedPost && selectedPost.boardId === postId) {
        setSelectedPost({ ...selectedPost, likeCount: response.likeCount });
      }
    } catch (err: any) {
      alert(err.message || "좋아요 처리에 실패했습니다.");
    }
  };

  const handleSave = async (postId: number) => {
    try {
      // 이미 스크랩되어 있는지 확인
      if (savedPosts.has(postId)) {
        // 스크랩 삭제
        await myApi.deleteScrap(postId);
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        // 상세보기 모달이 열려있으면 업데이트
        if (selectedPost && selectedPost.boardId === postId) {
          // 상태는 이미 업데이트됨
        }
      } else {
        // 스크랩 추가
        await myApi.createScrap(postId);
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes("이미 스크랩한")) {
        alert("이미 스크랩한 게시글입니다.");
      } else {
        alert(err.message || "스크랩 처리에 실패했습니다.");
      }
    }
  };

  const createPost = (type: "community" | "question") => {
    setEditingPost(null);
    setActiveTab(type);
    setShowWriteModal(true);
  };

  const editPost = (post: Post) => {
    setEditingPost(post);
    setShowDetailModal(false); // 상세보기 모달 닫기
    setSelectedPost(null);
    setSelectedPostFiles([]);
    setSelectedPostComments([]);
    setLoadingComments(false);
    setCommentsError(null);
    setShowWriteModal(true); // 수정 모달 열기
  };

  const viewPost = async (post: Post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
    setSelectedPostComments([]); // 초기화
    setCommentsError(null);
    setLoadingComments(true);
    // 댓글만 먼저 빠르게 로드
    try {
      const commentsResponse = await postApi.getComments(post.boardId);
      console.log("댓글 응답:", commentsResponse); // 디버깅용
      const comments = commentsResponse.comments || [];
      setSelectedPostComments(comments);
      if (comments.length === 0) {
        setCommentsError(null); // 댓글이 없는 것은 에러가 아님
      }
    } catch (err: any) {
      console.error("댓글 조회 에러:", err);
      setCommentsError(err.message || "댓글을 불러오는데 실패했습니다.");
      setSelectedPostComments([]);
    } finally {
      setLoadingComments(false);
    }
    // 나머지는 백그라운드에서 로드
    fetchPostDetail(post.boardId);
  };

  const deletePost = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await postApi.delete(id);
      alert("게시글이 삭제되었습니다.");
      setShowDetailModal(false);
      setSelectedPost(null);
      fetchPosts(); // 목록 새로고침
    } catch (err: any) {
      alert(err.message || "게시글 삭제에 실패했습니다.");
    }
  };

  const savePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const apiFormData = new FormData();
      apiFormData.append("title", formData.get("title") as string);
      apiFormData.append("type", activeTab);
      apiFormData.append("content", formData.get("content") as string);

      // 메인 이미지가 있으면 추가
      const mainImage = formData.get("mainImage") as File | null;
      if (mainImage && mainImage.size > 0) {
        apiFormData.append("mainImage", mainImage);
      }

      // 첨부 파일들이 있으면 추가
      const files = formData.getAll("files") as File[];
      files.forEach((file) => {
        if (file.size > 0) {
          apiFormData.append("files", file);
        }
      });

      if (editingPost) {
        // 수정 모드
        // 삭제할 파일 ID 목록 (현재는 구현하지 않음, 필요시 추가)
        // apiFormData.append("deleteFileIds", JSON.stringify([]));
        await postApi.update(editingPost.boardId, apiFormData);
        alert("게시글이 성공적으로 수정되었습니다.");
      } else {
        // 작성 모드
        await postApi.create(apiFormData);
        alert("게시글이 성공적으로 작성되었습니다.");
      }

      setShowWriteModal(false);
      setEditingPost(null);
      fetchPosts(); // 목록 새로고침
    } catch (error: any) {
      alert(error.message || "게시글 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      await postApi.createComment(postId, text);
      setCommentText({ ...commentText, [postId]: "" });
      setCommentsError(null);
      // 댓글 목록 새로고침
      const commentsResponse = await postApi.getComments(postId);
      setSelectedPostComments(commentsResponse.comments || []);
      // 댓글 수 업데이트
      const newCount =
        commentsResponse.commentCount || commentsResponse.comments?.length || 0;
      setCommentCounts((prev) => new Map(prev).set(postId, newCount));
    } catch (err: any) {
      alert(err.message || "댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectComment = async (postId: number, replyId: number) => {
    try {
      await postApi.selectComment(postId, replyId);
      alert("답변이 채택되었습니다.");
      // 댓글 목록 새로고침
      const commentsResponse = await postApi.getComments(postId);
      setSelectedPostComments(commentsResponse.comments || []);
      // 댓글 수 업데이트
      const newCount =
        commentsResponse.commentCount || commentsResponse.comments?.length || 0;
      setCommentCounts((prev) => new Map(prev).set(postId, newCount));
      // 게시글 상세 정보 새로고침
      await fetchPostDetail(postId);
    } catch (err: any) {
      alert(err.message || "답변 채택에 실패했습니다.");
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.replyId);
    setEditCommentText({
      ...editCommentText,
      [comment.replyId]: comment.reply || comment.content || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText({});
  };

  const handleUpdateComment = async (postId: number, replyId: number) => {
    const text = editCommentText[replyId]?.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      await postApi.updateComment(postId, replyId, text);
      setEditingCommentId(null);
      setEditCommentText({});
      // 댓글 목록 새로고침
      const commentsResponse = await postApi.getComments(postId);
      setSelectedPostComments(commentsResponse.comments || []);
      // 댓글 수 업데이트 (수정은 개수 변화 없음, 하지만 일관성을 위해)
      const newCount =
        commentsResponse.commentCount || commentsResponse.comments?.length || 0;
      setCommentCounts((prev) => new Map(prev).set(postId, newCount));
    } catch (err: any) {
      alert(err.message || "댓글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (postId: number, replyId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      setSubmitting(true);
      await postApi.deleteComment(postId, replyId);
      // 댓글 목록 새로고침
      const commentsResponse = await postApi.getComments(postId);
      setSelectedPostComments(commentsResponse.comments || []);
      // 댓글 수 업데이트
      const newCount =
        commentsResponse.commentCount || commentsResponse.comments?.length || 0;
      setCommentCounts((prev) => new Map(prev).set(postId, newCount));
    } catch (err: any) {
      alert(err.message || "댓글 삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const isMyComment = (comment: Comment) => {
    return (
      currentUserId !== null &&
      (comment.userIdx === currentUserId ||
        (typeof comment.userId === "number" &&
          comment.userId === currentUserId))
    );
  };

  const getMainImageUrl = (post: Post) => {
    // 먼저 postImages Map에서 확인 (게시글 목록용)
    if (postImages.has(post.boardId)) {
      return postImages.get(post.boardId) || null;
    }
    // 상세보기 모달에서 사용하는 경우
    if (!post.mainImageId) return null;
    const mainFile = selectedPostFiles.find(
      (f) => f.fileKey === post.mainImageId && f.isMainImage
    );
    if (mainFile) {
      return `${API_BASE_URL}${mainFile.filePath}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />

      {/* Tab Navigation - Fixed */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-[#2B2C28] bg-[#131515]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              onClick={() => handleTabChange("community")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "community"
                  ? "bg-[#339989] text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#2B2C28]"
              }`}
            >
              커뮤니티
            </Button>
            <Button
              onClick={() => handleTabChange("question")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "question"
                  ? "bg-[#339989] text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#2B2C28]"
              }`}
            >
              질문게시판
            </Button>
          </div>

          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="검색..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
                onKeyPress={handleSearchKeyPress}
                className="w-64 h-9 pl-10 pr-4 bg-[#2B2C28] border border-[#2B2C28] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-9 px-4 bg-[#339989] text-white hover:bg-[#2d8578] transition"
            >
              검색
            </Button>
            {searchQuery && (
              <Button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                variant="ghost"
                className="h-9 px-3 text-slate-400 hover:text-white hover:bg-[#2B2C28] transition"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={() => createPost(activeTab)}
              className="h-9 px-4 bg-[#339989] text-white text-sm font-medium rounded-lg hover:bg-[#7DE2D1] transition"
            >
              글쓰기
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-36">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#7DE2D1] animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">게시글이 없습니다.</p>
          </div>
        )}

        {!loading && !error && activeTab === "community" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {posts.map((post) => {
              const isLiked = likedPosts.has(post.boardId);
              const isSaved = savedPosts.has(post.boardId);
              const mainImageUrl = getMainImageUrl(post);

              return (
                <div
                  key={post.boardId}
                  className="bg-[#2B2C28] rounded-lg overflow-hidden border border-[#2B2C28]/50 hover:border-[#339989]/30 transition cursor-pointer"
                  onClick={() => viewPost(post)}
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center overflow-hidden">
                        {(post.profileImageUrl || post.profile_image_url) &&
                        !imageErrors.has(post.boardId) ? (
                          <img
                            src={
                              (
                                post.profileImageUrl || post.profile_image_url
                              )?.startsWith("http")
                                ? post.profileImageUrl || post.profile_image_url
                                : `${API_BASE_URL}${
                                    post.profileImageUrl ||
                                    post.profile_image_url
                                  }`
                            }
                            alt="프로필 사진"
                            className="w-full h-full object-cover"
                            onError={() => {
                              setImageErrors((prev) =>
                                new Set(prev).add(post.boardId)
                              );
                            }}
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {post.name ||
                            post.userName ||
                            (typeof post.userId === "number"
                              ? `User ${post.userId}`
                              : post.userId)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {currentUserId !== null &&
                      (post.userIdx === currentUserId ||
                        post.userId === currentUserId) && (
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              className="text-slate-400 hover:text-white transition"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              className="min-w-[120px] bg-[#2B2C28] border border-[#339989]/30 rounded-lg p-1 shadow-lg z-50"
                              align="end"
                              sideOffset={5}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded hover:bg-[#339989]/20 cursor-pointer outline-none"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  editPost(post);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                수정
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded hover:bg-red-500/20 cursor-pointer outline-none"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  deletePost(post.boardId);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                삭제
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      )}
                  </div>

                  {/* Post Image */}
                  {mainImageUrl && (
                    <div className="aspect-square bg-[#131515] relative">
                      <img
                        src={mainImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-white mb-1">
                        {post.title}
                      </p>
                      <p className="text-sm text-slate-400 line-clamp-2 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <p className="font-medium text-white">
                        좋아요 {post.likeCount || 0}개
                      </p>
                      <p className="font-medium text-white">
                        댓글 {commentCounts.get(post.boardId) ?? 0}개
                      </p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.boardId);
                        }}
                        className="transition"
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            isLiked ? "fill-red-500 text-red-500" : "text-white"
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPost(post);
                        }}
                        className="text-white transition"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(post.boardId);
                        }}
                        className="transition"
                      >
                        <Bookmark
                          className={`w-6 h-6 ${
                            isSaved ? "fill-white text-white" : "text-white"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && activeTab === "question" && (
          <div className="space-y-3">
            {posts.map((post) => {
              return (
                <div
                  key={post.boardId}
                  onClick={() => viewPost(post)}
                  className="bg-[#2B2C28] rounded-lg p-5 border border-[#2B2C28]/50 hover:border-[#339989]/50 transition cursor-pointer"
                >
                  <div className="flex gap-6">
                    {/* Stats Column */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-4 text-center min-w-[80px]">
                      <div>
                        <div className="text-lg font-bold text-slate-400">
                          {post.likeCount || 0}
                        </div>
                        <div className="text-xs text-slate-500">추천</div>
                      </div>
                      <div>
                        <div
                          className={`text-lg font-bold ${
                            post.isSolved ? "text-[#339989]" : "text-slate-400"
                          }`}
                        >
                          {commentCounts.get(post.boardId) ?? 0}
                        </div>
                        <div className="text-xs text-slate-500">답변</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-400">
                          {post.views}
                        </div>
                        <div className="text-xs text-slate-500">조회</div>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-white hover:text-[#7DE2D1] transition line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {post.isSolved && (
                            <span className="flex-shrink-0 px-2 py-1 bg-[#339989]/20 text-[#7DE2D1] text-xs font-medium rounded-md border border-[#339989]">
                              해결됨
                            </span>
                          )}
                          {currentUserId !== null &&
                            (post.userIdx === currentUserId ||
                              post.userId === currentUserId) && (
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button
                                    className="text-slate-400 hover:text-white transition"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="min-w-[120px] bg-[#2B2C28] border border-[#339989]/30 rounded-lg p-1 shadow-lg z-50"
                                    align="end"
                                    sideOffset={5}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <DropdownMenu.Item
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded hover:bg-[#339989]/20 cursor-pointer outline-none"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        editPost(post);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                      수정
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded hover:bg-red-500/20 cursor-pointer outline-none"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        deletePost(post.boardId);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      삭제
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 mb-4 line-clamp-2 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {/* 키워드는 백엔드에서 제공하지 않으므로 제거 */}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <User className="w-4 h-4" />
                          <span>
                            {post.name ||
                              post.userName ||
                              (typeof post.userId === "number"
                                ? `User ${post.userId}`
                                : post.userId)}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-[#2B2C28] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#339989] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition ${
                    currentPage === page
                      ? "bg-[#339989] text-white font-medium"
                      : "bg-[#2B2C28] text-slate-400 hover:bg-[#339989] hover:text-white"
                  }`}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 bg-[#2B2C28] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#339989] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingPost
                  ? "게시글 수정"
                  : activeTab === "community"
                  ? "커뮤니티 글쓰기"
                  : "질문하기"}
              </h2>
              <Button
                onClick={() => {
                  setShowWriteModal(false);
                  setEditingPost(null);
                }}
                className="p-2 hover:bg-[#2B2C28] rounded transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={savePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingPost?.title || ""}
                  required
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  내용
                </label>
                <textarea
                  name="content"
                  defaultValue={editingPost?.content || ""}
                  required
                  rows={6}
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  메인 이미지 (선택)
                </label>
                <input
                  type="file"
                  name="mainImage"
                  accept="image/*"
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  첨부 파일 (선택, 여러 개 가능)
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowWriteModal(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium disabled:opacity-50"
                >
                  {submitting
                    ? "처리 중..."
                    : editingPost
                    ? "수정하기"
                    : "작성하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedPost && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowDetailModal(false);
            setSelectedPost(null);
            setSelectedPostFiles([]);
            setSelectedPostComments([]);
            setLoadingComments(false);
            setCommentsError(null);
          }}
        >
          <div
            className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between sticky top-0 bg-[#1a1a18] z-10">
              <h2 className="text-xl font-bold text-white">게시글 상세</h2>
              <div className="flex items-center gap-2">
                {currentUserId !== null &&
                  ((selectedPost.userIdx !== undefined &&
                    selectedPost.userIdx === currentUserId) ||
                    (typeof selectedPost.userId === "number" &&
                      selectedPost.userId === currentUserId)) && (
                    <>
                      <Button
                        onClick={() => editPost(selectedPost)}
                        className="px-3 py-1 text-sm bg-[#339989] text-white rounded hover:bg-[#7DE2D1] transition"
                      >
                        수정
                      </Button>
                      <Button
                        onClick={() => deletePost(selectedPost.boardId)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                      >
                        삭제
                      </Button>
                    </>
                  )}
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPost(null);
                    setSelectedPostFiles([]);
                    setSelectedPostComments([]);
                    setLoadingComments(false);
                    setCommentsError(null);
                  }}
                  className="p-2 hover:bg-[#2B2C28] rounded transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {selectedPost.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(selectedPost.profileImageUrl ||
                        selectedPost.profile_image_url) &&
                      !imageErrors.has(selectedPost.boardId) ? (
                        <img
                          src={
                            (
                              selectedPost.profileImageUrl ||
                              selectedPost.profile_image_url
                            )?.startsWith("http")
                              ? selectedPost.profileImageUrl ||
                                selectedPost.profile_image_url
                              : `${API_BASE_URL}${
                                  selectedPost.profileImageUrl ||
                                  selectedPost.profile_image_url
                                }`
                          }
                          alt="프로필 사진"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImageErrors((prev) =>
                              new Set(prev).add(selectedPost.boardId)
                            );
                          }}
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-white">
                      {selectedPost.name ||
                        selectedPost.userName ||
                        (typeof selectedPost.userId === "number"
                          ? `User ${selectedPost.userId}`
                          : selectedPost.userId)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(selectedPost.createdAt).toLocaleString("ko-KR")}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedPost.views} 조회</span>
                    </div>
                    {selectedPost.type === "question" && (
                      <>
                        <span>•</span>
                        <span
                          className={`px-2 py-1 text-white text-xs rounded ${
                            selectedPost.isSolved
                              ? "bg-[#339989]"
                              : "bg-slate-500"
                          }`}
                        >
                          {selectedPost.isSolved ? "해결됨" : "미해결"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 파일 표시 */}
                {selectedPostFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedPostFiles
                      .filter((f) => f.isMainImage)
                      .map((file) => (
                        <img
                          key={file.fileKey}
                          src={`${API_BASE_URL}${file.filePath}`}
                          alt={file.fileName}
                          className="w-full rounded-lg"
                        />
                      ))}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>

                {/* 첨부 파일 목록 */}
                {selectedPostFiles.length > 0 && (
                  <div className="border-t border-[#2B2C28] pt-4">
                    <h3 className="text-white font-medium mb-2">첨부 파일</h3>
                    <div className="space-y-2">
                      {selectedPostFiles.map((file) => (
                        <a
                          key={file.fileKey}
                          href={`${API_BASE_URL}${file.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#7DE2D1] hover:underline text-sm"
                        >
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-[#2B2C28]">
                  <Button
                    onClick={() => handleLike(selectedPost.boardId)}
                    className={`flex items-center gap-2 transition ${
                      likedPosts.has(selectedPost.boardId)
                        ? "text-[#7DE2D1]"
                        : "text-slate-400 hover:text-[#7DE2D1]"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        likedPosts.has(selectedPost.boardId)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                    <span className="text-sm">
                      좋아요 {selectedPost.likeCount || 0}
                    </span>
                  </Button>
                </div>

                <div className="border-t border-[#2B2C28] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">
                      {selectedPost.type === "question" ? "답변" : "댓글"}{" "}
                      {loadingComments ? (
                        <span className="text-slate-400 text-sm">
                          (로딩 중...)
                        </span>
                      ) : (
                        <span>{selectedPostComments.length}개</span>
                      )}
                    </h3>
                    {!loadingComments && (
                      <button
                        onClick={() => {
                          if (selectedPost) {
                            setLoadingComments(true);
                            setCommentsError(null);
                            postApi
                              .getComments(selectedPost.boardId)
                              .then((response) => {
                                console.log("댓글 새로고침 응답:", response);
                                setSelectedPostComments(
                                  response.comments || []
                                );
                                // 댓글 수 업데이트
                                const newCount =
                                  response.commentCount ||
                                  response.comments?.length ||
                                  0;
                                setCommentCounts((prev) =>
                                  new Map(prev).set(
                                    selectedPost.boardId,
                                    newCount
                                  )
                                );
                              })
                              .catch((err: any) => {
                                console.error("댓글 새로고침 에러:", err);
                                setCommentsError(
                                  err.message ||
                                    "댓글을 불러오는데 실패했습니다."
                                );
                              })
                              .finally(() => {
                                setLoadingComments(false);
                              });
                          }
                        }}
                        className="text-sm text-slate-400 hover:text-[#7DE2D1] transition"
                      >
                        새로고침
                      </button>
                    )}
                  </div>

                  {/* 에러 메시지 */}
                  {commentsError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{commentsError}</p>
                    </div>
                  )}

                  {/* 댓글 작성 폼 */}
                  <div className="mb-6">
                    <textarea
                      value={commentText[selectedPost.boardId] || ""}
                      onChange={(e) =>
                        setCommentText({
                          ...commentText,
                          [selectedPost.boardId]: e.target.value,
                        })
                      }
                      placeholder="댓글을 입력하세요..."
                      rows={3}
                      className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-[#339989] transition mb-2"
                    />
                    <Button
                      onClick={() => handleCommentSubmit(selectedPost.boardId)}
                      disabled={
                        submitting || !commentText[selectedPost.boardId]?.trim()
                      }
                      className="px-4 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition disabled:opacity-50"
                    >
                      {submitting ? "작성 중..." : "댓글 작성"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {loadingComments ? (
                      <p className="text-slate-400 text-sm text-center py-4">
                        댓글을 불러오는 중...
                      </p>
                    ) : selectedPostComments.length > 0 ? (
                      selectedPostComments.map((comment) => (
                        <div key={comment.replyId} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center overflow-hidden flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                              <span className="text-white font-medium">
                                {comment.name ||
                                  comment.userName ||
                                  (typeof comment.userId === "number"
                                    ? `User ${comment.userId}`
                                    : comment.userId) ||
                                  (comment.userIdx
                                    ? `User ${comment.userIdx}`
                                    : "익명")}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(comment.createdAt).toLocaleString(
                                  "ko-KR"
                                )}
                              </span>
                              {selectedPost.type === "question" &&
                                !!comment.isSelected && (
                                  <span className="px-2 py-0.5 bg-[#339989] text-white text-xs rounded">
                                    채택됨
                                  </span>
                                )}
                              {isMyComment(comment) && (
                                <div className="flex items-center gap-2 ml-auto">
                                  {editingCommentId === comment.replyId ? (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleUpdateComment(
                                            selectedPost.boardId,
                                            comment.replyId
                                          )
                                        }
                                        disabled={submitting}
                                        className="px-2 py-1 text-xs bg-[#339989] text-white rounded hover:bg-[#7DE2D1] transition disabled:opacity-50"
                                      >
                                        저장
                                      </Button>
                                      <Button
                                        onClick={handleCancelEdit}
                                        disabled={submitting}
                                        className="px-2 py-1 text-xs bg-[#2B2C28] text-slate-400 rounded hover:bg-[#2B2C28]/80 transition"
                                      >
                                        취소
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleEditComment(comment)
                                        }
                                        className="px-2 py-1 text-xs text-slate-400 hover:text-white transition"
                                      >
                                        수정
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleDeleteComment(
                                            selectedPost.boardId,
                                            comment.replyId
                                          )
                                        }
                                        disabled={submitting}
                                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                      >
                                        삭제
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            {editingCommentId === comment.replyId ? (
                              <textarea
                                value={editCommentText[comment.replyId] || ""}
                                onChange={(e) =>
                                  setEditCommentText({
                                    ...editCommentText,
                                    [comment.replyId]: e.target.value,
                                  })
                                }
                                rows={3}
                                className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-[#339989] transition mb-2"
                              />
                            ) : (
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {comment.reply || comment.content}
                              </p>
                            )}
                            {selectedPost.type === "question" &&
                              !comment.isSelected &&
                              !selectedPostComments.some((c) => c.isSelected) && // 이미 채택된 댓글이 없을 때만
                              editingCommentId !== comment.replyId &&
                              currentUserId !== null &&
                              ((selectedPost.userIdx !== undefined &&
                                selectedPost.userIdx === currentUserId) ||
                                (typeof selectedPost.userId === "number" &&
                                  selectedPost.userId === currentUserId)) && (
                                <Button
                                  onClick={() =>
                                    handleSelectComment(
                                      selectedPost.boardId,
                                      comment.replyId
                                    )
                                  }
                                  className="mt-2 px-3 py-1 text-xs bg-[#339989] text-white rounded hover:bg-[#7DE2D1] transition"
                                >
                                  채택하기
                                </Button>
                              )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">
                        댓글이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
