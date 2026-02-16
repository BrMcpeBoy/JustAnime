import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield, faLock, faEye, faEyeSlash, faComment,
  faTrash, faBroadcastTower, faPaperPlane, faSpinner,
  faUsers, faCheck, faChevronLeft, faChevronRight,
  faExclamationTriangle, faSearch, faTimes, faSignal,
  faReply, faUser
} from '@fortawesome/free-solid-svg-icons';
import getAnimeInfo from '@/src/utils/getAnimeInfo.utils';

const COMMENT_API_URL = import.meta.env.VITE_COMMENT_API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1827';
// The ADMIN_KEY sent to backend for protected endpoints
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'admin-secret-key';

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onSuccess();
      } else {
        setError('Incorrect password. Access denied.');
        setShaking(true);
        setPassword('');
        setTimeout(() => setShaking(false), 600);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Syne', 'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        animation: shaking ? 'shake 0.6s ease' : 'none',
      }}>
        {/* Card */}
        <div style={{
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 40,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          {/* Icon */}
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <FontAwesomeIcon icon={faShield} style={{ color: '#fff', fontSize: 28 }} />
          </div>

          <h1 style={{
            textAlign: 'center', color: '#fff', fontSize: 22,
            fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6
          }}>
            Admin Access
          </h1>
          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13,
            marginBottom: 32, lineHeight: 1.5
          }}>
            Enter your administrator password to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)', fontSize: 14
              }}>
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Admin password"
                autoFocus
                style={{
                  width: '100%', padding: '14px 48px 14px 44px',
                  background: '#0a0a0a',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  color: '#fff', fontSize: 14, outline: 'none',
                  letterSpacing: password && !showPassword ? '0.25em' : 'normal',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 4
                }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: 12 }} />
                <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', padding: '14px',
                background: loading || !password ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                opacity: !password ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', letterSpacing: '0.02em',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!loading && password) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && password) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faShield} />}
              {loading ? 'Verifying...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-10px)}
          30%{transform:translateX(10px)}
          45%{transform:translateX(-8px)}
          60%{transform:translateX(8px)}
          75%{transform:translateX(-4px)}
          90%{transform:translateX(4px)}
        }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
      `}</style>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [animeData, setAnimeData] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${COMMENT_API_URL}/api/admin/all-comments`);
      const data = await res.json();
      if (data.success) {
        const allComments = data.comments || [];
        
        // Paginate manually
        const limit = 20;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedComments = allComments.slice(start, end);
        
        setComments(paginatedComments);
        setCommentsTotal(allComments.length);
        setCommentsTotalPages(Math.ceil(allComments.length / limit));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch(`${COMMENT_API_URL}/api/community/broadcasts`);
      const data = await res.json();
      if (data.success) setBroadcasts(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'comments') fetchComments(commentsPage);
  }, [activeTab, commentsPage, fetchComments]);

  useEffect(() => {
    if (activeTab === 'broadcast') fetchBroadcasts();
  }, [activeTab, fetchBroadcasts]);

  // Fetch anime info for all unique animeIds
  useEffect(() => {
    if (comments.length === 0) return;
    
    const uniqueIds = [...new Set(comments.map((c) => c.animeId).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const fetchAll = async () => {
      const results = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const info = await getAnimeInfo(id);
            const title = info?.data?.title || null;
            const poster = info?.data?.poster || null;
            return title ? { id, title, poster } : null;
          } catch {
            return null;
          }
        })
      );
      const map = {};
      results.forEach((r) => {
        if (r) map[r.id] = { title: r.title, poster: r.poster };
      });
      setAnimeData(map);
    };
    fetchAll();
  }, [comments]);

  const deleteComment = async (id) => {
    if (!window.confirm('Delete this comment and all its replies?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${COMMENT_API_URL}/api/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: ADMIN_KEY })
      });
      const data = await res.json();
      if (data.success) {
        // Refetch comments to update the list
        await fetchComments(commentsPage);
        showToast('Comment deleted');
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const deleteBroadcast = async (id) => {
    if (!window.confirm('Delete this broadcast and all linked notifications?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${COMMENT_API_URL}/api/community/broadcasts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: ADMIN_KEY })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcasts(prev => prev.filter(b => b._id !== id));
        showToast('Broadcast deleted');
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await fetch(`${COMMENT_API_URL}/api/community/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg, adminKey: ADMIN_KEY })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess('✓ Broadcast sent successfully');
        setBroadcastMsg('');
        setTimeout(() => setBroadcastSuccess(''), 3000);
        fetchBroadcasts();
      }
    } catch (err) {
      showToast('Broadcast failed', 'error');
    } finally {
      setBroadcastSending(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const filteredComments = searchQuery
    ? comments.filter(c => {
        const text = (c.text || c.content || '').toLowerCase();
        const user = (c.username || c.userId || '').toLowerCase();
        return text.includes(searchQuery.toLowerCase()) || user.includes(searchQuery.toLowerCase());
      })
    : comments;

  const cardStyle = {
    background: '#000000',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '20px',
    marginBottom: 16,
    transition: 'border-color 0.2s',
  };

  const handleUserClick = (e, userId) => {
    e.stopPropagation();
    navigate(`/user/${userId}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'Syne', 'Inter', sans-serif",
      padding: '0 20px 20px 20px',
    }}>
      {/* Header */}
      <div className="admin-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#000000', 
        borderTop: '2px solid rgba(255,255,255,0.1)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0 0 12px 12px', 
        padding: '24px 28px', 
        marginBottom: 28,
        animation: 'fadeInDown 0.4s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FontAwesomeIcon icon={faShield} style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Manage community content
            </p>
          </div>
        </div>
        <div className="admin-stats" style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <FontAwesomeIcon icon={faSignal} style={{ color: '#10b981', fontSize: 14 }} />
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999999,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 10, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInDown 0.3s ease',
        }}>
          <FontAwesomeIcon icon={toast.type === 'success' ? faCheck : faExclamationTriangle} style={{
            color: toast.type === 'success' ? '#10b981' : '#ef4444'
          }} />
          <span style={{ color: '#fff', fontSize: 13 }}>{toast.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        background: '#000000', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, marginBottom: 24, padding: 8, display: 'flex', gap: 8
      }}>
        <button
          onClick={() => setActiveTab('comments')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
            background: activeTab === 'comments' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'comments' ? '#fff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <FontAwesomeIcon icon={faComment} />
          Comments ({commentsTotal})
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
            background: activeTab === 'broadcast' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'broadcast' ? '#fff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <FontAwesomeIcon icon={faBroadcastTower} />
          Broadcast
        </button>
      </div>

      {/* Content */}
      <div>
        {/* ── BROADCAST TAB ──────────────────────────────────────────── */}
        {activeTab === 'broadcast' && (
          <div>
            {/* Send form */}
            <div style={{
              background: '#000000', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: 20, marginBottom: 20
            }}>
              <label style={{ display: 'block', color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                Send Community Announcement
              </label>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type your message to all users..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                  color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={sendBroadcast}
                  disabled={broadcastSending || !broadcastMsg.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: broadcastSending || !broadcastMsg.trim() ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.12)',
                    border: `1px solid ${broadcastSending || !broadcastMsg.trim() ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.3)'}`,
                    color: broadcastSending || !broadcastMsg.trim() ? 'rgba(255,255,255,0.3)' : '#10b981',
                    cursor: broadcastSending || !broadcastMsg.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'inherit', transition: 'all 0.2s'
                  }}
                >
                  {broadcastSending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                  {broadcastSending ? 'Sending...' : 'Send Broadcast'}
                </button>
                {broadcastSuccess && (
                  <span style={{ color: '#10b981', fontSize: 13 }}>{broadcastSuccess}</span>
                )}
              </div>
            </div>

            {/* History */}
            {broadcasts.length === 0 ? (
              <EmptyState icon={faBroadcastTower} message="No broadcasts yet" />
            ) : (
              <div>
                {broadcasts.map(b => (
                  <div key={b._id} style={cardStyle}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: '50%',
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FontAwesomeIcon icon={faBroadcastTower} style={{ color: '#10b981', fontSize: 13 }} 
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600,
                            background: 'rgba(16,185,129,0.12)',
                            color: '#34d399',
                            border: '1px solid currentColor', opacity: 0.8,
                          }}>
                            community
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#e2e8f0', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {b.message}
                        </p>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          Sent {formatDate(b.createdAt)}
                        </span>
                      </div>
                      <DeleteButton id={b._id} deletingId={deletingId} onClick={() => deleteBroadcast(b._id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS TAB ──────────────────────────────────────────── */}
        {activeTab === 'comments' && (
          <div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search comments by text or username..." />
            {loading ? <LoadingSpinner /> : filteredComments.length === 0 ? (
              <EmptyState icon={faComment} message="No comments found" />
            ) : (
              <>
                {filteredComments.map(c => {
                  const isReply = c.parentId && c.parentId !== null;
                  const isGeneralComment = !c.episodeId || c.episodeId === 'general';
                  const animeTitle = animeData[c.animeId]?.title || c.animeTitle || 'Unknown Anime';
                  const animeImage = animeData[c.animeId]?.poster || null;
                  const avatarSrc = c.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || 'U')}&background=random&size=128`;
                  
                  return (
                    <div 
                      key={c._id} 
                      style={cardStyle}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    >
                      <div style={{ display: 'flex', gap: 16 }}>
                        {/* Notification Icon */}
                        <div style={{ flexShrink: 0, marginTop: 4 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <FontAwesomeIcon
                              icon={isReply ? faReply : faComment}
                              style={{
                                color: isReply ? '#60a5fa' : '#a78bfa',
                                fontSize: 20
                              }}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* User and Action */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <button
                                onClick={(e) => handleUserClick(e, c.userId)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                <img
                                  src={avatarSrc}
                                  alt={c.username}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                  }}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || 'U')}&background=random&size=128`;
                                  }}
                                />
                              </button>
                              <span style={{ 
                                color: 'rgba(255,255,255,0.5)', 
                                fontSize: 11,
                                textAlign: 'center',
                              }}>
                                {isReply ? 'reply' : 'comment'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleUserClick(e, c.userId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                flex: 1,
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => {
                                const p = e.currentTarget.querySelector('p');
                                if (p) p.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                const p = e.currentTarget.querySelector('p');
                                if (p) p.style.color = 'rgba(255,255,255,0.8)';
                              }}
                            >
                              <div>
                                <p style={{
                                  color: 'rgba(255,255,255,0.8)',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  margin: 0,
                                  transition: 'color 0.2s',
                                }}>
                                  @{c.username || c.userId || 'Unknown User'}
                                </p>
                                <p style={{
                                  color: 'rgba(255,255,255,0.4)',
                                  fontSize: '11px',
                                  margin: 0,
                                  marginTop: 2,
                                }}>
                                  {formatDate(c.createdAt)}
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* Anime and Episode Info with Image - Clickable */}
                          {c.animeId && (
                            <button
                              onClick={() => {
                                // Navigate to the comment location, just like NotificationModal
                                if (isGeneralComment) {
                                  // Navigate to anime info page for general comments
                                  navigate(`/${c.animeId}?commentId=${c._id}`);
                                } else {
                                  // Navigate to watch page for episode-specific comments
                                  navigate(`/watch/${c.animeId}?ep=${c.episodeId}&commentId=${c._id}`);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 12,
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => {
                                const img = e.currentTarget.querySelector('img');
                                const titleSpan = e.currentTarget.querySelector('[data-title]');
                                if (img) {
                                  img.style.transform = 'scale(1.05)';
                                  img.style.borderColor = 'rgba(255,255,255,0.3)';
                                }
                                if (titleSpan) {
                                  titleSpan.style.color = 'rgba(255,255,255,1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                const img = e.currentTarget.querySelector('img');
                                const titleSpan = e.currentTarget.querySelector('[data-title]');
                                if (img) {
                                  img.style.transform = 'scale(1)';
                                  img.style.borderColor = 'rgba(255,255,255,0.15)';
                                }
                                if (titleSpan) {
                                  titleSpan.style.color = 'rgba(255,255,255,0.9)';
                                }
                              }}
                            >
                              {animeImage && (
                                <img
                                  src={animeImage}
                                  alt={animeTitle}
                                  style={{
                                    width: 56,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    flexShrink: 0,
                                    transition: 'all 0.2s',
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div 
                                  data-title
                                  style={{ 
                                    fontSize: 14, 
                                    color: 'rgba(255,255,255,0.9)', 
                                    marginBottom: 4, 
                                    fontWeight: 500,
                                    transition: 'color 0.2s',
                                  }}
                                >
                                  <span style={{ maxWidth: '100%', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {animeTitle}
                                  </span>
                                </div>
                                {!isGeneralComment && c.episodeNumber && (
                                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                                    Episode {c.episodeNumber}
                                  </div>
                                )}
                                {isGeneralComment && (
                                  <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>
                                    General Comments
                                  </div>
                                )}
                              </div>
                            </button>
                          )}

                          {/* Comment Text */}
                          <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            padding: 14,
                            marginBottom: 0,
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: 15,
                              color: 'rgba(255,255,255,0.9)',
                              lineHeight: 1.6,
                              wordBreak: 'break-word',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {c.text || c.content || '(empty)'}
                            </p>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                          <DeleteButton id={c._id} deletingId={deletingId} onClick={() => deleteComment(c._id)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  page={commentsPage}
                  totalPages={commentsTotalPages}
                  total={commentsTotal}
                  onPrev={() => setCommentsPage(p => Math.max(1, p - 1))}
                  onNext={() => setCommentsPage(p => Math.min(commentsTotalPages, p + 1))}
                />
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeInDown {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
            padding: 16px 20px !important;
          }
          .admin-stats {
            width: 100%;
            justify-content: flex-start;
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Small reusable sub-components ───────────────────────────────────────────

function DeleteButton({ id, deletingId, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={deletingId === id}
      style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: 8,
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
        cursor: deletingId === id ? 'not-allowed' : 'pointer',
        color: 'rgba(239,68,68,0.6)', fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { 
        if (deletingId !== id) {
          e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; 
          e.currentTarget.style.color = '#ef4444'; 
        }
      }}
      onMouseLeave={(e) => { 
        if (deletingId !== id) {
          e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; 
          e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; 
        }
      }}
    >
      {deletingId === id
        ? <FontAwesomeIcon icon={faSpinner} spin />
        : <FontAwesomeIcon icon={faTrash} />
      }
    </button>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <FontAwesomeIcon icon={faSearch} style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'rgba(255,255,255,0.3)', fontSize: 13
      }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 40px 11px 40px',
          background: '#000000', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 13
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
      }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)' }} />
      </div>
      <p style={{ fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#fff',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}

function Pagination({ page, totalPages, total, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 20, padding: '14px 0',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        Page {page} of {totalPages} · {total} total
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onPrev}
          disabled={page === 1}
          style={{
            padding: '7px 14px', borderRadius: 8,
            background: '#000000', border: '1px solid rgba(255,255,255,0.1)',
            color: page === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (page !== 1) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            if (page !== 1) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Prev
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          style={{
            padding: '7px 14px', borderRadius: 8,
            background: '#000000', border: '1px solid rgba(255,255,255,0.1)',
            color: page === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (page !== totalPages) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            if (page !== totalPages) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          Next <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AdminManage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
