import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Trash2, Edit3, Circle, ChevronDown, ChevronUp, RotateCcw, Save, LogOut } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(null);
  const [subtaskInput, setSubtaskInput] = useState({ text: '', difficulty: 1 });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => { if (session) fetchTasks(); }, [session]);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!error) setTasks(data);
  };

  const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true); // Починаємо завантаження
  const { error } = isRegistering 
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });
  
  if (error) alert(error.message);
  else if (isRegistering) alert("Перевірте пошту для підтвердження!");
  
  setLoading(false); // Закінчуємо завантаження
};

  const addTask = async () => {
    if (!newTaskTitle) return;
    await supabase.from('tasks').insert([{ title: newTaskTitle, user_id: session.user.id, subtasks: [], is_completed: false }]);
    setNewTaskTitle('');
    fetchTasks();
  };

  const saveEditedTitle = async (id) => {
    await supabase.from('tasks').update({ title: editTitleValue }).eq('id', id);
    setEditingTaskId(null);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    if (window.confirm("Видалити це завдання?")) {
      await supabase.from('tasks').delete().eq('id', id);
      fetchTasks();
    }
  };

  const toggleTaskStatus = async (task) => {
    const progress = calculateProgress(task.subtasks);
    let updatedSubtasks = task.subtasks ? [...task.subtasks] : [];
    let newIsCompleted = !task.is_completed;

    if (task.is_completed || progress === 100) {
      newIsCompleted = false; 
      // Якщо прогрес був 100%, знімаюємо галочку з останнього підпункту
      if (progress === 100 && updatedSubtasks.length > 0) {
        updatedSubtasks[updatedSubtasks.length - 1].completed = false;
      }
    }

    await supabase.from('tasks').update({ 
      is_completed: newIsCompleted, 
      subtasks: updatedSubtasks 
    }).eq('id', task.id);
    
    fetchTasks();
  };

  const calculateProgress = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return null;
    const total = subtasks.reduce((acc, st) => acc + st.difficulty, 0);
    const done = subtasks.reduce((acc, st) => st.completed ? acc + st.difficulty : acc, 0);
    return Math.round((done / total) * 100);
  };

  // Фільтрація
  const activeTasks = tasks.filter(t => {
    const progress = calculateProgress(t.subtasks);
    return !t.is_completed && (progress === null || progress < 100);
  });

  const completedTasks = tasks.filter(t => {
    const progress = calculateProgress(t.subtasks);
    return t.is_completed || (progress !== null && progress === 100);
  });

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '50px', border: '6px double #1a3e70ff', borderRadius: '15px', boxShadow: '0 3px 10px rgba(34, 37, 50, 0.71)', textAlign: 'center', backgroundColor: '#f3eee8ff' }}>
        <h2 style={{ color: '#1a3e70ff', marginBottom: '30px' }}>✭My to-do✭</h2>
        <form onSubmit={handleAuth}>
          <input type="email" placeholder="Електронна пошта" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: '13px', marginBottom: '13px', borderRadius: '8px', border: '1px dashed #dbd6d0ff' }} required />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: '13px', marginBottom: '20px', borderRadius: '8px', border: '1px dashed #dbd6d0ff' }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#1a3e70ff', color: '#fffcf8ff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {loading ? 'Зачекайте...' : isRegistering ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: '#1a3e70ff', marginTop: '15px', cursor: 'pointer', fontSize: '14px' }}>
          {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Створити'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '20px auto', padding: '30px', fontFamily: 'courier, Inter, system-ui, sans-serif', color: '#1a3e70ff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a3e70ff', margin: 0 }}>✭My to-do✭</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', color: '#1a3e70ff', border: '1px solid #dbd6d0ff', background: '#fffcf8ff', cursor: 'pointer' }}>
          <LogOut size={16} /> Вийти
        </button>
      </header>

      {/* Поле додавання */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <input 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px dashed #dbd6d0ff' }}
          placeholder="Назва нового завдання..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button onClick={addTask} style={{ backgroundColor: '#1a3e70ff', color: '#fffcf8ff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Додати</button>
      </div>

      {/* Список активних */}
      <div>
        {activeTasks.map(task => (
          <TaskCard 
            key={task.id}
            task={task}
            isEditing={editingTaskId === task.id}
            editTitleValue={editTitleValue}
            setEditTitleValue={setEditTitleValue}
            onEdit={() => { setEditingTaskId(task.id); setEditTitleValue(task.title); }}
            onSave={() => saveEditedTitle(task.id)}
            onCancel={() => setEditingTaskId(null)}
            onDelete={deleteTask}
            onToggle={() => toggleTaskStatus(task)}
            progress={calculateProgress(task.subtasks)}
            showSubForm={showSubtaskForm === task.id}
            setShowSubForm={setShowSubtaskForm}
            subtaskInput={subtaskInput}
            setSubtaskInput={setSubtaskInput}
            fetchTasks={fetchTasks}
          />
        ))}
      </div>

      {/* Архів */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ width: '100%', padding: '12px', background: '#d7cabaff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#1a3e70ff' }}
          >
            {showCompleted ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
            {showCompleted ? 'Сховати архів' : `Завершені завдання (${completedTasks.length})`}
          </button>
          
          {showCompleted && (
            <div style={{ marginTop: '15px' }}>
              {completedTasks.map(task => (
                <div key={task.id} style={{ padding: '12px', borderBottom: '1px dashed #dbd6d0ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f3eee8ff' }}>
                  <span style={{ textDecoration: 'line-through', color: '#a89886ff' }}>{task.title}</span>
                  <div style={{ display: 'flex', gap: '1px' }}>
                    <button title="Відновити" onClick={() => toggleTaskStatus(task)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><RotateCcw size={18} color="#1a3e70a0"/></button>
                    <button title="Видалити" onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} color="#da6565ff"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, isEditing, editTitleValue, setEditTitleValue, onEdit, onSave, onCancel, onDelete, onToggle, progress, fetchTasks }) {
  
  const [editingSubIdx, setEditingSubIdx] = useState(null);
  const [editSubText, setEditSubText] = useState('');
  
  const [quickSubtaskText, setQuickSubtaskText] = useState('');
  const [quickDifficulty, setQuickDifficulty] = useState(1);

  const handleQuickAdd = async (e) => {
    if (e.key && e.key !== 'Enter') return;
    if (!quickSubtaskText.trim()) return;

    const updated = [...(task.subtasks || []), { 
      text: quickSubtaskText, 
      difficulty: quickDifficulty, 
      completed: false 
    }];

    const { error } = await supabase.from('tasks').update({ subtasks: updated }).eq('id', task.id);
    if (!error) {
      setQuickSubtaskText(''); 
      fetchTasks();
    }
  };

  const toggleSubtask = async (idx) => {
    const updated = [...task.subtasks];
    updated[idx].completed = !updated[idx].completed;
    await supabase.from('tasks').update({ subtasks: updated }).eq('id', task.id);
    fetchTasks();
  };

  const deleteSubtask = async (idx) => {
    const updated = task.subtasks.filter((_, i) => i !== idx);
    await supabase.from('tasks').update({ subtasks: updated }).eq('id', task.id);
    fetchTasks();
  };

  const saveSubtaskEdit = async (idx) => {
    const updated = [...task.subtasks];
    updated[idx].text = editSubText;
    await supabase.from('tasks').update({ subtasks: updated }).eq('id', task.id);
    setEditingSubIdx(null);
    fetchTasks();
  };

  return (
    <div style={{ background: '#f3eee8ff', padding: '30px', borderRadius: '15px', boxShadow: '0 3px 10px rgba(34, 37, 50, 0.71)', marginBottom: '18px', border: '6px double #1a3e70ff' }}>
      {/* Шапка завдання */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Circle color="#1a3e70ff" />
          </button>
          
          {isEditing ? (
            <input 
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '2px dashed #1a3e70ff' }} 
              value={editTitleValue} 
              onChange={(e) => setEditTitleValue(e.target.value)}
              autoFocus
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{task.title}</h3>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditing ? (
            <button onClick={onSave} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Save size={20} color="#56b910ff"/></button>
          ) : (
            <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={18} color="#1a3e70a0"/></button>
          )}
          <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} color="#da6565ff"/></button>
        </div>
      </div>

      {/* Прогрес-бар */}
      {progress !== null && (
        <div style={{ marginTop: '5px' }}>
          <div style={{ width: '100%', height: '8px', background: '#fffcf8ff', borderRadius: '10px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#1a3e70ff', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      )}

      {/* Список існуючих підпунктів */}
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {task.subtasks?.map((st, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '3px 8px', borderRadius: '8px', background: '#fffcf8ff' }}>
            <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(idx)} style={{ cursor: 'pointer' }} />
            
            {editingSubIdx === idx ? (
              <input 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed #1a3e70ff' }}
                value={editSubText} 
                onChange={(e) => setEditSubText(e.target.value)} 
                onBlur={() => saveSubtaskEdit(idx)}
                onKeyDown={(e) => e.key === 'Enter' && saveSubtaskEdit(idx)}
                autoFocus
              />
            ) : (
              <span 
                onClick={() => { setEditingSubIdx(idx); setEditSubText(st.text); }}
                style={{ flex: 1, fontSize: '15px', textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? '#1a3e7095' : '#1a3e70ff', cursor: 'pointer' }}
              >
                {st.text}
              </span>
            )}
            
            <span style={{ fontSize: '10px' }}>{Array(st.difficulty).fill('🟤').join('')}</span>
            <button onClick={() => deleteSubtask(idx)} style={{ border: 'none', background: 'transparent', color: '#1a3e7073', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Поле швидкого додавання підпункту */}
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          style={{ flex: 1, padding: '9px 12px', fontSize: '14px', borderRadius: '8px', border: '1px dashed #dbd6d0ff', outline: 'none' }}
          placeholder="Додати підпункт..."
          value={quickSubtaskText}
          onChange={(e) => setQuickSubtaskText(e.target.value)}
          onKeyDown={handleQuickAdd}
        />
        <select 
          value={quickDifficulty} 
          onChange={(e) => setQuickDifficulty(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #dbd6d0ff', background: '#fffcf8ff', cursor: 'pointer' }}
        >
          <option value="1">☀️</option>
          <option value="2">⛅️</option>
          <option value="3">☁️</option>
          <option value="4">🔥</option>
          <option value="5">☄️</option>
        </select>
        <button 
          onClick={handleQuickAdd}
          style={{ background: '#d7cabaff', border: 'none', padding: '6px 11px', borderRadius: '8px', cursor: 'pointer', color: '#1a3e70ff', fontWeight: 'bold' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default App;