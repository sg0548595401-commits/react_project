import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-ignore
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  IconButton, 
  Container, 
  CircularProgress, 
  Alert, 
  Select, 
  MenuItem, 
  FormControl,
  SelectChangeEvent
} from '@mui/material';
import { useSelector } from 'react-redux';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

// הגדרת טיפוסים לאירועים
interface ServerToClientEvents {
  newComment: (data: { ticketId: string; comment: any }) => void;
  statusUpdated: (data: { ticketId: string; statusId: number; statusName: string }) => void;
}

interface ClientToServerEvents {
  joinTicket: (data: { ticketId: string }) => void;
  leaveTicket: (data: { ticketId: string }) => void;
  newComment: (data: { ticketId: string; comment: any }) => void;
  statusUpdated: (data: { ticketId: string; statusId: number; statusName: string }) => void;
}

// הוספת טיפוסים ידנית
interface Socket {
  id?: string;
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback?: (data: any) => void): void;
  emit(event: string, data: any): void;
  disconnect(): void;
}

// יצירת חיבור WebSocket
let socket: Socket | null = null;

const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    }) as Socket;
    
    socket.on('connect', () => {
      console.log('WebSocket connected! ID:', socket?.id);
    });
  }
  return socket as Socket;
};

declare global {
  interface Window {
    io: any;
  }
}

// טיפוסים
interface Status {
  id: number;
  name: string;
}

interface Comment {
  id: number;
  content: string;
  author_id: string | number;
  author_name: string;
  created_at: string;
}

interface Ticket {
  id: number;
  subject: string;
  status_id: number | null;
  status_name: string | null;
  comments: Comment[];
  created_by: number;
  created_at: string;
}

interface AuthState {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

interface RootState {
  auth: AuthState;
}

const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // שליפת הטוקן והמשתמש מה-Redux
  const { user, token } = useSelector((state: RootState) => state.auth) || {};
  
  const [ticket, setTicket] = useState<Partial<Ticket> & { title?: string } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // טעינת סטטוסים זמינים
  const fetchStatuses = async () => {
    if (!token) return;
    
    try {
      const res = await axios.get<Status[]>('http://localhost:4000/statuses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatuses(res.data);
    } catch (err) {
      console.error('שגיאה בטעינת סטטוסים:', err);
    }
  };

  const fetchTicket = async () => {
    if (!id || id === 'undefined' || !token) {
      setError('מזהה פנייה לא תקין');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [ticketRes, commentsRes] = await Promise.all([
        axios.get<Ticket>(`http://localhost:4000/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get<Comment[]>(`http://localhost:4000/tickets/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setTicket({
        ...ticketRes.data,
        comments: commentsRes.data || []
      });
      setError('');
      
      // גלילה אוטומטית להודעה האחרונה
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err: any) {
      console.error("שגיאה בטעינת נתונים:", err);
      setError(err.response?.status === 404 ? 'הפנייה לא נמצאה בשרת' : 'שגיאת תקשורת עם השרת');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchTicket();
      fetchStatuses();
      
      const socket = getSocket();
      console.log('Joining ticket:', id);
      
      // הצטרפות לחדר ה-WebSocket
      socket.emit('joinTicket', { ticketId: id });
      
      // פונקציות ה-handler עם closure על id הנוכחי
      const handleNewComment = (data: any) => {
        console.log('Received newComment from server/broadcast:', data, 'current id:', id);
        // השווה כ-string כדי לתמוך בשני סוגים
        if (String(data.ticketId) === String(id)) {
          // בדוק אם הודעה זו כבר ברשימה (יכול להיות שהשרת שלח אותה חזרה)
          setTicket((prev: any) => {
            const commentExists = prev?.comments?.some((c: any) => 
              c.id === data.comment.id || 
              (c.created_at === data.comment.created_at && c.author_id === data.comment.author_id)
            );
            
            if (commentExists) {
              console.log('Comment already exists, skipping duplicate');
              return prev;
            }
            
            console.log('Adding new comment to ticket');
            return {
              ...prev,
              comments: [...(prev?.comments || []), data.comment]
            };
          });
          
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      };

      const handleStatusUpdated = (data: any) => {
        console.log('Received statusUpdated:', data, 'current id:', id);
        // השווה כ-string כדי לתמוך בשני סוגים
        if (String(data.ticketId) === String(id)) {
          console.log('Updating status for current ticket:', data.statusName);
          setTicket((prev: any) => ({
            ...prev,
            status_id: data.statusId,
            status_name: data.statusName
          }));
        }
      };
      
      // מוחקים listeners ישנים כדי למנוע duplicates
      socket.off('newComment');
      socket.off('statusUpdated');
      
      // מוסיפים listeners חדשים
      socket.on('newComment', handleNewComment);
      socket.on('statusUpdated', handleStatusUpdated);
      
      console.log('Listeners registered for ticket:', id);
    }
    
    // ניקוי כאשר הקומפוננטה נהרסת או ID משתנה
    return () => {
      const socket = getSocket();
      socket.off('newComment');
      socket.off('statusUpdated');
      if (id) {
        console.log('Leaving ticket:', id);
        socket.emit('leaveTicket', { ticketId: id });
      }
    };
  }, [id, token]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !ticket || !id || !token || !user) {
      console.log('Cannot send - missing data:', { message: message.trim(), ticket: !!ticket, id, token: !!token, user: !!user });
      return;
    }
    
    console.log('Sending message:', { message, ticketId: id, userId: user.id });

    try {
      const res = await axios.post<Comment>(
        `http://localhost:4000/tickets/${id}/comments`,
        { content: message },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      
      console.log('Server response:', res.data);

      // יצירת הודעה חדשה עם כל הנתונים
      const newComment: Comment = {
        ...res.data,
        author_name: user.name,
        author_id: user.id
      };
      
      // הוספת ההודעה מיד לרשימה כדי שהמשתמש יראה אותה
      setTicket((prev: any) => ({
        ...prev,
        comments: [...(prev?.comments || []), newComment]
      }));
      
      console.log('Added comment to local state');
      
      // גלילה אוטומטית להודעה החדשה
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // שליחה דרך WebSocket לכל המשתמשים האחרים
      const socket = getSocket();
      console.log('Broadcasting newComment:', { ticketId: id, comment: newComment });
      socket.emit('newComment', {
        ticketId: id,
        comment: newComment
      });

      setMessage('');
      console.log('Message sent successfully');
    } catch (err: any) {
      console.error('Error sending message:', err?.response?.data || err);
      setError('שגיאה בשליחת ההודעה. נסה שוב מאוחר יותר.');
    }
  };

  // פונקציה לעדכון סטטוס
  const handleStatusChange = async (event: SelectChangeEvent<number | string>) => {
    const newStatusId = Number(event.target.value);
    console.log('=== STATUS CHANGE START ===');
    console.log('New Status ID:', newStatusId, 'Type:', typeof newStatusId);
    console.log('Current Ticket ID:', id);
    console.log('Token present:', !!token);
    console.log('Ticket present:', !!ticket);
    console.log('Is NaN:', isNaN(newStatusId));
    
    if (!id || !token || isNaN(newStatusId) || !ticket) {
      console.log('❌ Cannot change status - missing data:', { id, token: !!token, newStatusId, ticket: !!ticket });
      return;
    }
    
    console.log('✅ All validations passed');

    try {
      // עדכון ה-state מיד בהתחלה
      const statusName = statuses.find(s => s.id === newStatusId)?.name || '';
      console.log('📋 Status name found:', statusName);
      
      setTicket((prev: any) => ({
        ...prev,
        status_id: newStatusId,
        status_name: statusName
      }));
      console.log('✅ Updated local state');

      // שליחה לשרת
      const payload = { status_id: newStatusId };
      const url = `http://localhost:4000/tickets/${id}`;
      
      console.log('🚀 Sending PATCH to server');
      console.log('  URL:', url);
      console.log('  Payload:', payload);
      
      const patchRes = await axios.patch<Ticket>(
        url,
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      console.log('✅ Server response status:', patchRes.status);
      console.log('✅ Server response data:', patchRes.data);
      
      // עדכון סטטוס דרך WebSocket לכולם
      const socket = getSocket();
      console.log('📤 Broadcasting statusUpdated via WebSocket');
      console.log('  Payload:', { ticketId: id, statusId: newStatusId, statusName });
      
      socket.emit('statusUpdated', {
        ticketId: id,
        statusId: newStatusId,
        statusName: statusName
      });
      console.log('✅ statusUpdated broadcasted');
      
    } catch (err: any) {
      console.log('❌ ERROR IN STATUS CHANGE!');
      console.log('Error status:', err?.response?.status);
      console.log('Error data:', err?.response?.data);
      console.log('Error message:', err?.message);
      console.log('Full error:', err);
      
      setError('שגיאה בעדכון הסטטוס: ' + (err?.response?.data?.message || err?.message));
      fetchTicket();
    }
    console.log('=== STATUS CHANGE END ===');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error" action={<Button color="inherit" onClick={() => navigate(-1)}>חזור</Button>}>
        {error}
      </Alert>
    </Container>
  );

  return (
    <Container maxWidth="md" dir="rtl" sx={{ mt: 4, pb: 4 }}>
      {/* כותרת עליונה */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 3, border: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e' }}>
              {ticket?.subject || 'פרטי פנייה'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="body2">סטטוס:</Typography>
              {user?.role !== 'customer' ? (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={ticket?.status_id || ''}
                    onChange={(e) => {
                      console.log('Status Select changed! Value:', e.target.value);
                      handleStatusChange(e);
                    }}
                    displayEmpty
                    sx={{ height: 32, minWidth: 150 }}
                  >
                    {statuses.length > 0 ? (
                      statuses.map((status: Status) => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>אין סטטוסים זמינים</MenuItem>
                    )}
                  </Select>
                </FormControl>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  {ticket?.status_name || 'ללא סטטוס'}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* אזור ההודעות */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: '500px', 
          overflowY: 'auto', 
          bgcolor: '#f8f9fa', 
          p: 3, 
          borderRadius: 4, 
          mb: 2,
          border: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Stack spacing={2}>
          {ticket?.comments && ticket.comments.length > 0 ? (
            ticket.comments.map((comment: any, i: number) => {
              const isMe = comment.author_id === user?.id;
              const isNew = Date.now() - new Date(comment.created_at).getTime() < 60000; // הודעה חדשה מ-60 השניות האחרונות
              
              return (
                <Box 
                  key={comment.id || i} 
                  sx={{ 
                    alignSelf: isMe ? 'flex-end' : 'flex-start', 
                    maxWidth: '75%',
                    animation: isNew ? 'fadeIn 0.3s ease-out' : 'none',
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      px: 1, 
                      mb: 0.5, 
                      display: 'block', 
                      textAlign: isMe ? 'left' : 'right',
                      fontWeight: 500,
                      color: 'text.secondary'
                    }}
                  >
                    {comment.author_name || 'משתמש אנונימי'}
                    <Typography component="span" variant="caption" sx={{ mr: 1, color: 'text.disabled' }}>
                      • {new Date(comment.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: isMe ? '#1a237e' : 'white', 
                      color: isMe ? 'white' : 'text.primary',
                      borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        right: isMe ? '-8px' : 'auto',
                        left: isMe ? 'auto' : '-8px',
                        width: '16px',
                        height: '16px',
                        background: isMe ? '#1a237e' : 'white',
                        clipPath: isMe ? 'polygon(100% 0, 0 100%, 100% 100%)' : 'polygon(0 0, 0 100%, 100% 0)'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {comment.content}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 3
            }}>
              <Typography variant="h6" gutterBottom>אין הודעות עדיין</Typography>
              <Typography variant="body2">התחל את השיחה על ידי שליחת הודעה ראשונה</Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Paper>

      {/* שורת כתיבה */}
      <Box 
        component="form" 
        onSubmit={handleSend}
        sx={{
          position: 'relative',
          display: 'flex',
          gap: 1,
          pt: 1,
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
          }
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="כתוב הודעה..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          maxRows={4}
          sx={{
            bgcolor: 'background.paper',
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
              pr: 1.5,
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& textarea': {
              py: 1.5,
              '&::placeholder': {
                opacity: 0.7,
              },
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!message.trim()}
          sx={{
            minWidth: 48,
            height: 48,
            alignSelf: 'flex-end',
            mb: 0.5,
            borderRadius: '50%',
            p: 0,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
            transition: 'all 0.2s',
          }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Container>
  );
};

export default TicketDetails;