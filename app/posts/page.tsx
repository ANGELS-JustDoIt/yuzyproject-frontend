"use client";
import { useState } from "react";
import type React from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

interface Post {
  board_id: number;
  title: string;
  type: "community" | "question";
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  main_image_id?: number;
  views: number;
  is_solved: boolean;
}

interface Comment {
  reply_id: number;
  board_id: number;
  seq: number;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_selected: boolean;
}

interface Keyword {
  board_id: number;
  keyword: string;
  keyword_id: number;
}

interface FileAttachment {
  board_type: string;
  board_id: number;
  file_path: string;
  file_name: string;
  seq: number;
  user_id: string;
  file_key: string;
  created_at: string;
}

// 목 데이터
const mockPosts: Post[] = [
  // 커뮤니티 게시글 30개
  ...Array.from({ length: 30 }, (_, i) => ({
    board_id: i + 1,
    title: `커뮤니티 게시글 ${i + 1}`,
    type: "community" as const,
    content: `이것은 커뮤니티 게시글 ${
      i + 1
    }의 내용입니다. 오늘 배운 내용을 공유합니다!`,
    user_id: `user_${String(i + 1).padStart(3, "0")}`,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    updated_at: new Date(Date.now() - i * 3600000).toISOString(),
    main_image_id: (i % 3) + 1,
    views: Math.floor(Math.random() * 500) + 10,
    is_solved: false,
  })),
  // 질문 게시글 30개
  ...Array.from({ length: 30 }, (_, i) => ({
    board_id: i + 31,
    title: `질문 게시글 ${i + 1}: ${
      ["React", "JavaScript", "Python", "Java", "TypeScript"][i % 5]
    } 관련 질문`,
    type: "question" as const,
    content: `${
      ["React", "JavaScript", "Python", "Java", "TypeScript"][i % 5]
    }에 대한 질문입니다. ${i + 1}번째 질문이에요.`,
    user_id: `user_${String(i + 31).padStart(3, "0")}`,
    created_at: new Date(Date.now() - i * 7200000).toISOString(),
    updated_at: new Date(Date.now() - i * 7200000).toISOString(),
    views: Math.floor(Math.random() * 1000) + 50,
    is_solved: i % 3 === 0,
  })),
];

const mockKeywords: Keyword[] = mockPosts
  .filter((p) => p.type === "question")
  .flatMap((p, idx) => [
    {
      board_id: p.board_id,
      keyword: ["React", "JavaScript", "Python", "Java", "TypeScript"][idx % 5],
      keyword_id: idx * 3 + 1,
    },
    {
      board_id: p.board_id,
      keyword: ["hooks", "async", "OOP", "Spring", "types"][idx % 5],
      keyword_id: idx * 3 + 2,
    },
  ]);

const mockComments: Comment[] = mockPosts.flatMap((p, idx) =>
  Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
    reply_id: idx * 10 + i + 1,
    board_id: p.board_id,
    seq: i + 1,
    content: `댓글 ${i + 1}번: 좋은 내용이네요!`,
    user_id: `user_${String(idx + i).padStart(3, "0")}`,
    created_at: new Date(Date.now() - (idx + i) * 3600000).toISOString(),
    updated_at: new Date(Date.now() - (idx + i) * 3600000).toISOString(),
    is_selected: p.type === "question" && i === 0,
  }))
);

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<"community" | "question">(
    "community"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = activeTab === "community" ? 9 : 15;

  const filteredPosts = mockPosts.filter(
    (post) =>
      post.type === activeTab &&
      (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  const handleTabChange = (tab: "community" | "question") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSave = (postId: number) => {
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const createPost = (type: "community" | "question") => {
    setEditingPost(null);
    setActiveTab(type);
    setShowWriteModal(true);
  };

  const editPost = (post: Post) => {
    setEditingPost(post);
    setShowWriteModal(true);
  };

  const viewPost = (post: Post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  const deletePost = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const savePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // 백엔드 API 형식에 맞게 FormData 구성
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

    try {
      const { postApi } = await import("@/lib/api");
      await postApi.create(apiFormData);
      alert("게시글이 성공적으로 작성되었습니다.");
      setShowWriteModal(false);
      setEditingPost(null);
      // 페이지 새로고침 또는 게시글 목록 다시 불러오기
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "게시글 작성에 실패했습니다.");
    }
  };

  const getPostKeywords = (board_id: number) => {
    return mockKeywords.filter((k) => k.board_id === board_id);
  };

  const getPostComments = (board_id: number) => {
    return mockComments.filter((c) => c.board_id === board_id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />

      {/* 글쓰기 버튼 (posts 페이지 전용) */}
      <div className="fixed top-20 right-6 z-40">
        <Button
          onClick={() => createPost(activeTab)}
          className="h-9 px-4 bg-[#339989] text-white text-sm font-medium rounded-lg hover:bg-[#7DE2D1] transition shadow-lg"
        >
          글쓰기
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="pt-20 border-b border-[#2B2C28]">
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-10 pr-4 bg-[#2B2C28] border border-[#2B2C28] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "community" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {currentPosts.map((post) => {
              const postComments = getPostComments(post.board_id);
              const isLiked = likedPosts.has(post.board_id);
              const isSaved = savedPosts.has(post.board_id);

              return (
                <div
                  key={post.board_id}
                  className="bg-[#2B2C28] rounded-lg overflow-hidden border border-[#2B2C28]/50 hover:border-[#339989]/30 transition"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {post.user_id}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Image */}
                  <div
                    className="aspect-square bg-[#131515] relative cursor-pointer"
                    onClick={() => viewPost(post)}
                  >
                    <img
                      src={`/ceholder-svg-key-uvxel-height-600-width-600-text-p.jpg?key=uvxel&height=600&width=600&text=Post+${post.board_id}`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Post Actions */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.board_id)}
                          className="transition"
                        >
                          <Heart
                            className={`w-6 h-6 ${
                              isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-white"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => viewPost(post)}
                          className="text-white transition"
                        >
                          <MessageCircle className="w-6 h-6" />
                        </button>
                        <button className="text-white transition">
                          <Bookmark
                            className={`w-6 h-6 ${
                              isSaved ? "fill-white text-white" : "text-white"
                            }`}
                          />
                        </button>
                      </div>
                      <button
                        onClick={() => handleSave(post.board_id)}
                        className="transition"
                      >
                        <Bookmark
                          className={`w-6 h-6 ${
                            isSaved ? "fill-white text-white" : "text-white"
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white mb-1">
                        좋아요 {Math.floor(Math.random() * 500) + 10}개
                      </p>
                      <p className="text-sm text-white">
                        <span className="font-medium">{post.user_id}</span>{" "}
                        {post.title}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {post.content}
                      </p>
                    </div>

                    {postComments.length > 0 && (
                      <button
                        onClick={() => viewPost(post)}
                        className="text-sm text-slate-400 hover:text-white transition"
                      >
                        댓글 {postComments.length}개 모두 보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "question" && (
          <div className="space-y-3">
            {currentPosts.map((post) => {
              const keywords = getPostKeywords(post.board_id);
              const postComments = getPostComments(post.board_id);
              const votes = Math.floor(Math.random() * 50) - 10;

              return (
                <div
                  key={post.board_id}
                  onClick={() => viewPost(post)}
                  className="bg-[#2B2C28] rounded-lg p-5 border border-[#2B2C28]/50 hover:border-[#339989]/50 transition cursor-pointer"
                >
                  <div className="flex gap-6">
                    {/* Stats Column */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-4 text-center min-w-[80px]">
                      <div>
                        <div
                          className={`text-lg font-bold ${
                            votes > 0 ? "text-[#7DE2D1]" : "text-slate-400"
                          }`}
                        >
                          {votes}
                        </div>
                        <div className="text-xs text-slate-500">추천</div>
                      </div>
                      <div>
                        <div
                          className={`text-lg font-bold ${
                            post.is_solved ? "text-[#339989]" : "text-slate-400"
                          }`}
                        >
                          {postComments.length}
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
                        {post.is_solved && (
                          <span className="flex-shrink-0 px-2 py-1 bg-[#339989]/20 text-[#7DE2D1] text-xs font-medium rounded-md border border-[#339989]">
                            해결됨
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((tag) => (
                            <span
                              key={tag.keyword_id}
                              className="px-2 py-1 bg-[#131515] text-[#7DE2D1] text-xs rounded-md border border-[#339989]/30"
                            >
                              {tag.keyword}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <User className="w-4 h-4" />
                          <span>{post.user_id}</span>
                          <span>•</span>
                          <span>
                            {new Date(post.created_at).toLocaleDateString()}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-[#2B2C28] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#339989] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}

            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
                onClick={() => setShowWriteModal(false)}
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
                  onClick={() => setShowWriteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
                >
                  {editingPost ? "수정하기" : "작성하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between sticky top-0 bg-[#1a1a18] z-10">
              <h2 className="text-xl font-bold text-white">게시글 상세</h2>
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPost(null);
                }}
                className="p-2 hover:bg-[#2B2C28] rounded transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {selectedPost.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="font-medium text-white">
                      {selectedPost.user_id}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(selectedPost.created_at).toLocaleString(
                        "ko-KR"
                      )}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedPost.views} 조회</span>
                    </div>
                    {selectedPost.is_solved && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-1 bg-[#339989] text-white text-xs rounded">
                          해결됨
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {selectedPost.type === "question" && (
                  <div className="flex gap-2">
                    {getPostKeywords(selectedPost.board_id).map((tag) => (
                      <span
                        key={tag.keyword_id}
                        className="px-3 py-1 bg-[#2B2C28] text-[#7DE2D1] text-sm rounded-full flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {tag.keyword}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-[#2B2C28]">
                  <Button
                    onClick={() => handleLike(selectedPost.board_id)}
                    className={`flex items-center gap-2 transition ${
                      likedPosts.has(selectedPost.board_id)
                        ? "text-[#7DE2D1]"
                        : "text-slate-400 hover:text-[#7DE2D1]"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        likedPosts.has(selectedPost.board_id)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                    <span className="text-sm">좋아요</span>
                  </Button>
                </div>

                <div className="border-t border-[#2B2C28] pt-6">
                  <h3 className="text-white font-medium mb-4">
                    {selectedPost.type === "question" ? "답변" : "댓글"}{" "}
                    {getPostComments(selectedPost.board_id).length}개
                  </h3>
                  <div className="space-y-4">
                    {getPostComments(selectedPost.board_id).map((comment) => (
                      <div key={comment.reply_id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2B2C28]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                            <span className="text-white font-medium">
                              {comment.user_id}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(comment.created_at).toLocaleString(
                                "ko-KR"
                              )}
                            </span>
                            {comment.is_selected && (
                              <span className="px-2 py-0.5 bg-[#339989] text-white text-xs rounded">
                                채택됨
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
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
