import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Trash2, CheckCircle, Clock, AlertCircle, PlusSquare, FileText, Edit } from 'lucide-react';

// ダミーデータを使うかどうかのフラグ
const useDummyData = true

// GASのWebアプリURL - 必ず正確なURLに置き換えてください
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbynuBfCV2F9OvLGplL6tLByGKkmfLrHlY7BtOKGh-31E7qSL-k-F4_P0vNSr598Uu62/exec'

function App() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('monthly'); // デフォルトで当月表示
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 新規state
  const [channels, setChannels] = useState([]);
  const [outsources, setOutsources] = useState([]);
  const [showAddMasterForm, setShowAddMasterForm] = useState(false);
  const [newMasterItem, setNewMasterItem] = useState({ type: 'channel', name: '' });
  const [showOutsourceSummary, setShowOutsourceSummary] = useState(false);
  const [outsourceSummary, setOutsourceSummary] = useState([]);
  
  // 月次表示のための状態追加
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // 初期値は現在の年月（YYYY-MM形式）
  
  // 案件の初期状態 - 受注日フィールド追加
  const [newProject, setNewProject] = useState({
    title: "",
    orderDate: new Date().toISOString().slice(0, 10), // 現在日付をデフォルト値に設定
    channel: "",
    deadline: "",
    deliveryDate: "",
    status: "未着手",
    price: 0,
    outsourced: false,
    outsourceTo: "",
    outsourcePrice: 0,
    outsourceStatus: "未着手"
  });
  
  // 外注集計のソート機能追加
  const [outsourceSortType, setOutsourceSortType] = useState('outsourceTo'); // 'outsourceTo', 'month', 'both'
  const [outsourceMonth, setOutsourceMonth] = useState(currentMonth);
  
  // 案件編集の機能追加
  const [editingProject, setEditingProject] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // 月の選択肢を生成（過去12ヶ月分）
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = d.toISOString().slice(0, 7); // YYYY-MM形式
      const displayText = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      options.push({ value: yearMonth, text: displayText });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();

  // コンポーネントがマウントされたときにデータを取得
  useEffect(() => {
    if (useDummyData) {
      // ダミーデータをセット
      setProjects([
        { 
          id: 1, 
          title: "企業PR動画", 
          orderDate: "2025-03-15", // 受注日追加
          channel: "サンプルチャンネル1", 
          deadline: "2025-03-30", 
          deliveryDate: "2025-03-25",
          status: "進行中", 
          price: 100000,
          outsourced: true,
          outsourceTo: "サンプル外注先1",
          outsourcePrice: 50000,
          outsourceStatus: "進行中"
        },
        { 
          id: 2, 
          title: "製品紹介動画", 
          orderDate: "2025-03-10", // 受注日追加
          channel: "サンプルチャンネル2", 
          deadline: "2025-04-15", 
          deliveryDate: "",
          status: "未着手", 
          price: 150000,
          outsourced: false,
          outsourceTo: "",
          outsourcePrice: 0,
          outsourceStatus: ""
        }
      ]);
      
      // ダミーマスターデータをセット
      setChannels(['チャンネルA', 'チャンネルB', 'チャンネルC']);
      setOutsources(['外注先X', '外注先Y', '外注先Z']);
      
      setLoading(false);
    } else {
      // 実際のAPI呼び出し
      fetchProjects();
      fetchMasterData();
    }
  }, []);

  // GoogleスプレッドシートからプロジェクトデータをGAS経由で取得
  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('プロジェクトデータ取得開始...');
      
      const requestData = {
        action: 'getProjects'
      };
      console.log('送信データ:', requestData);
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('レスポンスステータス:', response.status);
      const responseText = await response.text();
      console.log('レスポンステキスト:', responseText);
      
      try {
        const result = JSON.parse(responseText);
        console.log('解析結果:', result);
        
        if (result.status === 'success') {
          setProjects(result.data);
          setError(null);
        } else {
          setError(result.message || '案件データの取得に失敗しました');
        }
      } catch (parseError) {
        console.error('JSONの解析に失敗:', parseError);
        setError('レスポンスの解析に失敗しました');
      }
    } catch (err) {
      console.error('通信エラー:', err);
      setError('サーバーとの通信に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // マスターデータを取得
  const fetchMasterData = async () => {
    if (useDummyData) return; // ダミーデータ使用時はスキップ
    
    try {
      const requestData = {
        action: 'getMasterData'
      };
      console.log('送信データ:', requestData);
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('レスポンスステータス:', response.status);
      const responseText = await response.text();
      console.log('レスポンステキスト:', responseText);
      
      try {
        const result = JSON.parse(responseText);
        console.log('解析結果:', result);
        
        if (result.status === 'success') {
          setChannels(result.data.channels);
          setOutsources(result.data.outsources);
        } else {
          console.error('マスターデータの取得に失敗しました:', result.message);
        }
      } catch (parseError) {
        console.error('JSONの解析に失敗:', parseError);
      }
    } catch (err) {
      console.error('サーバーとの通信に失敗しました:', err.message);
    }
  };

  // マスターアイテムを追加
  const handleAddMasterItem = async () => {
    if (!newMasterItem.name) {
      window.alert('名前を入力してください');
      return;
    }
    
    if (useDummyData) {
      // ダミーデータ使用時の処理
      if (newMasterItem.type === 'channel') {
        // 既存のチャンネルをチェック
        if (channels.includes(newMasterItem.name)) {
          window.alert('既に登録されています');
          return;
        }
        
        setChannels([...channels, newMasterItem.name]);
      } else if (newMasterItem.type === 'outsource') {
        // 既存の外注先をチェック
        if (outsources.includes(newMasterItem.name)) {
          window.alert('既に登録されています');
          return;
        }
        
        setOutsources([...outsources, newMasterItem.name]);
      }
      
      setNewMasterItem({ type: 'channel', name: '' });
      window.alert('追加されました');
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      const requestData = {
        action: 'addMasterItem',
        type: newMasterItem.type,
        name: newMasterItem.name
      };
      console.log('送信データ:', requestData);
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('レスポンスステータス:', response.status);
      const responseText = await response.text();
      console.log('レスポンステキスト:', responseText);
      
      try {
        const result = JSON.parse(responseText);
        console.log('解析結果:', result);
        
        if (result.status === 'success') {
          // マスターデータを再取得
          fetchMasterData();
          setNewMasterItem({ type: 'channel', name: '' });
          setShowAddMasterForm(false);
          window.alert('マスターデータを追加しました');
        } else {
          window.alert('追加に失敗しました: ' + result.message);
        }
      } catch (parseError) {
        console.error('JSONの解析に失敗:', parseError);
        window.alert('レスポンスの解析に失敗しました');
      }
    } catch (err) {
      console.error('エラー詳細:', err);
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // マスターアイテムを削除
  const handleDeleteMasterItem = async (type, name) => {
    if (!window.confirm(`${type === 'channel' ? 'チャンネル' : '外注先'} "${name}" を削除してもよろしいですか？`)) {
      return;
    }
    
    if (useDummyData) {
      // ダミーデータ使用時の処理
      if (type === 'channel') {
        setChannels(channels.filter(item => item !== name));
      } else if (type === 'outsource') {
        setOutsources(outsources.filter(item => item !== name));
      }
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      const requestData = {
        action: 'deleteMasterItem',
        type: type,
        name: name
      };
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // マスターデータを再取得
        fetchMasterData();
        window.alert('削除しました');
      } else {
        window.alert('削除に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 外注別集計データを取得
  const fetchOutsourceSummary = async () => {
    if (useDummyData) {
      // ダミーデータの外注集計
      const summary = [
        {
          outsourceTo: '外注先X',
          month: '2025-03',
          totalPrice: 50000,
          count: 1,
          projects: [{ title: '企業PR動画', price: 50000, orderDate: '2025-03-15' }]
        },
        {
          outsourceTo: '外注先Y',
          month: '2025-03',
          totalPrice: 70000,
          count: 1,
          projects: [{ title: '製品紹介動画', price: 70000, orderDate: '2025-03-10' }]
        },
        {
          outsourceTo: '外注先Y',
          month: '2025-04',
          totalPrice: 80000,
          count: 1,
          projects: [{ title: '採用動画', price: 80000, orderDate: '2025-04-05' }]
        }
      ];
      
      // ソート適用
      let filteredSummary = [...summary];
      
      if (outsourceSortType === 'month' || outsourceSortType === 'both') {
        filteredSummary = filteredSummary.filter(item => item.month === outsourceMonth);
      }
      
      if (outsourceSortType === 'outsourceTo' || outsourceSortType === 'both') {
        filteredSummary.sort((a, b) => a.outsourceTo.localeCompare(b.outsourceTo));
      }
      
      setOutsourceSummary(filteredSummary);
      setShowOutsourceSummary(true);
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      setLoading(true);
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'getOutsourceSummary',
          sortType: outsourceSortType,
          month: outsourceMonth
        })
      });
      
      const responseText = await response.text();
      console.log('レスポンス:', responseText);
      
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        setOutsourceSummary(result.data);
        setShowOutsourceSummary(true);
      } else {
        window.alert('外注別集計の取得に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 新規案件の追加
  const handleAddProject = async () => {
    if (useDummyData) {
      // ダミーデータ使用時の処理
      const newProjectWithId = {
        ...newProject,
        id: Date.now(),
        outsourceStatus: newProject.outsourced ? (newProject.outsourceStatus || "未着手") : ""
      };
      
      setProjects([...projects, newProjectWithId]);
      setNewProject({
        title: "",
        orderDate: new Date().toISOString().slice(0, 10), // 初期値をリセット
        channel: "",
        deadline: "",
        deliveryDate: "",
        status: "未着手",
        price: 0,
        outsourced: false,
        outsourceTo: "",
        outsourcePrice: 0,
        outsourceStatus: "未着手"
      });
      setShowNewProjectForm(false);
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      const project = {
        ...newProject,
        id: Date.now(),
        outsourceStatus: newProject.outsourced ? (newProject.outsourceStatus || "未着手") : ""
      };
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'addProject',
          data: project
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects([...projects, result.data]);
        setNewProject({
          title: "",
          orderDate: new Date().toISOString().slice(0, 10), // 初期値をリセット
          channel: "",
          deadline: "",
          deliveryDate: "",
          status: "未着手",
          price: 0,
          outsourced: false,
          outsourceTo: "",
          outsourcePrice: 0,
          outsourceStatus: "未着手"
        });
        setShowNewProjectForm(false);
      } else {
        window.alert('案件の追加に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 案件の削除
  const handleDeleteProject = async (id) => {
    if (!window.confirm('この案件を削除してもよろしいですか？')) {
      return;
    }
    
    if (useDummyData) {
      // ダミーデータ使用時の処理
      setProjects(projects.filter(project => project.id !== id));
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'deleteProject',
          id: id
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects(projects.filter(project => project.id !== id));
      } else {
        window.alert('案件の削除に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 案件ステータスの更新
  const handleStatusChange = async (id, newStatus) => {
    if (useDummyData) {
      // ダミーデータ使用時の処理
      setProjects(projects.map(project => 
        project.id === id ? { ...project, status: newStatus } : project
      ));
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      // 更新するプロジェクトを見つける
      const projectToUpdate = projects.find(project => project.id === id);
      
      if (!projectToUpdate) {
        window.alert('更新する案件が見つかりません');
        return;
      }
      
      // ステータスを更新したプロジェクトデータ
      const updatedProject = { ...projectToUpdate, status: newStatus };
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateProject',
          data: updatedProject
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects(projects.map(project => 
          project.id === id ? updatedProject : project
        ));
      } else {
        window.alert('ステータスの更新に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 外注ステータスの更新
  const handleOutsourceStatusChange = async (id, newStatus) => {
    if (useDummyData) {
      // ダミーデータ使用時の処理
      setProjects(projects.map(project => 
        project.id === id ? { ...project, outsourceStatus: newStatus } : project
      ));
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      // 更新するプロジェクトを見つける
      const projectToUpdate = projects.find(project => project.id === id);
      
      if (!projectToUpdate) {
        window.alert('更新する案件が見つかりません');
        return;
      }
      
      // 外注ステータスを更新したプロジェクトデータ
      const updatedProject = { ...projectToUpdate, outsourceStatus: newStatus };
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateProject',
          data: updatedProject
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects(projects.map(project => 
          project.id === id ? updatedProject : project
        ));
      } else {
        window.alert('外注ステータスの更新に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 納品日変更のハンドラー
  const handleDeliveryDateChange = async (id, newDate) => {
    if (useDummyData) {
      // ダミーデータ使用時の処理
      setProjects(projects.map(project => 
        project.id === id ? { ...project, deliveryDate: newDate } : project
      ));
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      // 更新するプロジェクトを見つける
      const projectToUpdate = projects.find(project => project.id === id);
      
      if (!projectToUpdate) {
        window.alert('更新する案件が見つかりません');
        return;
      }
      
      // 納品日のみを更新したプロジェクトデータ
      const updatedProject = { ...projectToUpdate, deliveryDate: newDate };
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateProject',
          data: updatedProject
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects(projects.map(project => 
          project.id === id ? updatedProject : project
        ));
      } else {
        window.alert('納品日の更新に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 案件を編集
  const handleEditProject = (project) => {
    setEditingProject({...project});
    setShowEditForm(true);
  };

  // 編集内容を保存
  const handleSaveEdit = async () => {
    if (useDummyData) {
      // ダミーデータ使用時の処理
      setProjects(projects.map(project => 
        project.id === editingProject.id ? editingProject : project
      ));
      setShowEditForm(false);
      setEditingProject(null);
      return;
    }
    
    // 実際のAPI呼び出し
    try {
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateProject',
          data: editingProject
        })
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.status === 'success') {
        // 成功したらローカルのstateを更新
        setProjects(projects.map(project => 
          project.id === editingProject.id ? editingProject : project
        ));
        setShowEditForm(false);
        setEditingProject(null);
      } else {
        window.alert('案件の更新に失敗しました: ' + result.message);
      }
    } catch (err) {
      window.alert('サーバーとの通信に失敗しました: ' + err.message);
    }
  };

  // 日付が指定した月に含まれているかチェックする関数（納期のみを使用）
  const isInSelectedMonth = (dateStr, yearMonth) => {
    if (!dateStr) return false;
    return dateStr.startsWith(yearMonth);
  };

  // 月次フィルタリングを適用したプロジェクトリスト（納期ベース）
  const monthlyFilteredProjects = projects.filter(project => 
    isInSelectedMonth(project.deadline, currentMonth)
  );

  // フィルタリングされた案件リスト
  const filteredProjects = projects.filter(project => {
    // 月次フィルターを最優先
    if (activeTab === 'monthly') {
      return isInSelectedMonth(project.deadline, currentMonth);
    }
    // 既存のフィルター
    if (activeTab === 'all') return true;
    if (activeTab === 'inProgress') return project.status === '進行中';
    if (activeTab === 'completed') return project.status === '完了';
    if (activeTab === 'notStarted') return project.status === '未着手';
    if (activeTab === 'outsourced') return project.outsourced;
    return true;
  });

  // 案件リストのソート（当月表示時は受注日順）
  const sortedFilteredProjects = useMemo(() => {
    let sorted = [...filteredProjects];
    
    if (activeTab === 'monthly') {
      // 受注日でソート（昇順）
      sorted.sort((a, b) => {
        // 受注日が無い場合は最後に表示
        if (!a.orderDate) return 1;
        if (!b.orderDate) return -1;
        return new Date(a.orderDate) - new Date(b.orderDate);
      });
    }
    
    return sorted;
  }, [filteredProjects, activeTab]);

  // ダッシュボード用の月次集計
  const monthlySummary = {
    totalRevenue: monthlyFilteredProjects.reduce((sum, project) => sum + (parseFloat(project.price) || 0), 0),
    totalOutsourceCost: monthlyFilteredProjects.reduce((sum, project) => sum + (parseFloat(project.outsourcePrice) || 0), 0)
  };
  monthlySummary.netProfit = monthlySummary.totalRevenue - monthlySummary.totalOutsourceCost;

  // 総売上の計算（全体）
  const totalRevenue = projects.reduce((sum, project) => sum + (parseFloat(project.price) || 0), 0);

  // 外注コストの計算（全体）
  const totalOutsourceCost = projects.reduce((sum, project) => sum + (parseFloat(project.outsourcePrice) || 0), 0);

  // 純利益の計算（全体）
  const netProfit = totalRevenue - totalOutsourceCost;

  // ステータスに応じたアイコンを表示
  const StatusIcon = ({ status }) => {
    switch(status) {
      case '完了':
        return <CheckCircle className="text-green-500" />;
      case '進行中':
        return <Clock className="text-blue-500" />;
      case '未着手':
        return <AlertCircle className="text-yellow-500" />;
      default:
        return null;
    }
  };

  // ローディング表示
  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="text-xl">データを読み込み中...</div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>エラーが発生しました: {error}</p>
          <button 
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={fetchProjects}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">動画台本受発注管理システム</h1>
      
      {/* ダッシュボード */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            ダッシュボード <span className="text-sm font-normal text-gray-500">
              （{monthOptions.find(o => o.value === currentMonth)?.text}）
            </span>
          </h2>
          <select
            className="p-2 border rounded"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm text-blue-700 mb-1">月間売上</h3>
            <p className="text-2xl font-bold">¥{monthlySummary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm text-red-700 mb-1">月間外注コスト</h3>
            <p className="text-2xl font-bold">¥{monthlySummary.totalOutsourceCost.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm text-green-700 mb-1">月間純利益</h3>
            <p className="text-2xl font-bold">¥{monthlySummary.netProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end mb-4 space-x-2">
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowAddMasterForm(!showAddMasterForm)}
        >
          <PlusSquare className="mr-2" size={18} />
          マスター追加
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={fetchOutsourceSummary}
        >
          <FileText className="mr-2" size={18} />
          外注別集計
        </button>
      </div>

      {/* マスター追加フォーム */}
      {showAddMasterForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">マスターデータ追加</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
              <select
                className="w-full p-2 border rounded"
                value={newMasterItem.type}
                onChange={(e) => setNewMasterItem({...newMasterItem, type: e.target.value})}
              >
                <option value="channel">チャンネル</option>
                <option value="outsource">外注先</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newMasterItem.name}
                onChange={(e) => setNewMasterItem({...newMasterItem, name: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleAddMasterItem}
              >
                追加
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">チャンネル一覧</h4>
              <ul className="bg-gray-50 p-2 rounded max-h-40 overflow-y-auto">
                {channels.length === 0 ? (
                  <li className="text-gray-500">データがありません</li>
                ) : (
                  channels.map((channel, index) => (
                    <li key={index} className="py-1 border-b border-gray-200 last:border-b-0 flex justify-between items-center">
                      <span>{channel}</span>
                      <button 
                        className="text-red-500 text-xs hover:text-red-700"
                        onClick={() => handleDeleteMasterItem('channel', channel)}
                      >
                        削除
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">外注先一覧</h4>
              <ul className="bg-gray-50 p-2 rounded max-h-40 overflow-y-auto">
                {outsources.length === 0 ? (
                  <li className="text-gray-500">データがありません</li>
                ) : (
                  outsources.map((outsource, index) => (
                    <li key={index} className="py-1 border-b border-gray-200 last:border-b-0 flex justify-between items-center">
                      <span>{outsource}</span>
                      <button 
                        className="text-red-500 text-xs hover:text-red-700"
                        onClick={() => handleDeleteMasterItem('outsource', outsource)}
                      >
                        削除
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 外注別集計 */}
      {showOutsourceSummary && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">外注別集計</h3>
            <button
              className="text-sm text-gray-500"
              onClick={() => setShowOutsourceSummary(false)}
            >
              閉じる
            </button>
          </div>
          
          {/* ソートコントロール */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ソート方法</label>
              <select
                className="p-2 border rounded"
                value={outsourceSortType}
                onChange={(e) => setOutsourceSortType(e.target.value)}
              >
                <option value="outsourceTo">外注先別</option>
                <option value="month">月別</option>
                <option value="both">月別・外注先別</option>
              </select>
            </div>
            
            {(outsourceSortType === 'month' || outsourceSortType === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
                <select
                  className="p-2 border rounded"
                  value={outsourceMonth}
                  onChange={(e) => setOutsourceMonth(e.target.value)}
                >
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="self-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={fetchOutsourceSummary}
              >
                再取得
              </button>
            </div>
          </div>
          
          {outsourceSummary.length === 0 ? (
            <p className="text-gray-500">外注データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外注先</th>
                    {outsourceSortType === 'month' || outsourceSortType === 'both' ? null : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">案件数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">総金額</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outsourceSummary.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.outsourceTo}</div>
                      </td>
                      {outsourceSortType === 'month' || outsourceSortType === 'both' ? null : (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {monthOptions.find(o => o.value === item.month)?.text || item.month}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.count}件
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ¥{parseFloat(item.totalPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* タブナビゲーション */}
      <div className="flex mb-4 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'monthly' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('monthly')}
        >
          当月
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('all')}
        >
          すべて
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'inProgress' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('inProgress')}
        >
          進行中
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'notStarted' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('notStarted')}
        >
          未着手
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('completed')}
        >
          完了
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'outsourced' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('outsourced')}
        >
          外注
        </button>
      </div>
      
      {/* 新規案件追加ボタン */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">
          案件一覧
          {activeTab === 'monthly' && (
            <span className="text-sm font-normal text-gray-500">
              （{monthOptions.find(o => o.value === currentMonth)?.text}）
            </span>
          )}
        </h2>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowNewProjectForm(!showNewProjectForm)}
        >
          <PlusCircle className="mr-2" size={18} />
          新規案件
        </button>
      </div>
      
      {/* 案件編集フォーム */}
      {showEditForm && editingProject && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">案件の編集: {editingProject.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 受注日フィールド */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受注日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={editingProject.orderDate || ''}
                onChange={(e) => setEditingProject({...editingProject, orderDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">チャンネル</label>
              <select
                className="w-full p-2 border rounded"
                value={editingProject.channel}
                onChange={(e) => setEditingProject({...editingProject, channel: e.target.value})}
              >
                <option value="">選択してください</option>
                {channels.map((channel, index) => (
                  <option key={index} value={channel}>{channel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">案件名</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={editingProject.title}
                onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">納期</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={editingProject.deadline || ''}
                onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">納品日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={editingProject.deliveryDate || ''}
                onChange={(e) => setEditingProject({...editingProject, deliveryDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受注金額</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={editingProject.price}
                onChange={(e) => setEditingProject({...editingProject, price: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                className="w-full p-2 border rounded"
                value={editingProject.status}
                onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
              >
                <option value="未着手">未着手</option>
                <option value="進行中">進行中</option>
                <option value="完了">完了</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={editingProject.outsourced}
                onChange={(e) => setEditingProject({...editingProject, outsourced: e.target.checked})}
              />
              <span className="text-sm font-medium text-gray-700">外注する</span>
            </label>
          </div>
          
          {editingProject.outsourced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注先</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingProject.outsourceTo || ''}
                  onChange={(e) => setEditingProject({...editingProject, outsourceTo: e.target.value})}
                >
                  <option value="">選択してください</option>
                  {outsources.map((outsource, index) => (
                    <option key={index} value={outsource}>{outsource}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注金額</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editingProject.outsourcePrice || 0}
                  onChange={(e) => setEditingProject({...editingProject, outsourcePrice: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注ステータス</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingProject.outsourceStatus || '未着手'}
                  onChange={(e) => setEditingProject({...editingProject, outsourceStatus: e.target.value})}
                >
                  <option value="未着手">未着手</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={() => {
                setShowEditForm(false);
                setEditingProject(null);
              }}
            >
              キャンセル
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleSaveEdit}
            >
              保存
            </button>
          </div>
        </div>
      )}
      
      {/* 新規案件フォーム */}
      {showNewProjectForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新規案件の登録</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 受注日フィールド */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受注日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={newProject.orderDate}
                onChange={(e) => setNewProject({...newProject, orderDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">チャンネル</label>
              <select
                className="w-full p-2 border rounded"
                value={newProject.channel}
                onChange={(e) => setNewProject({...newProject, channel: e.target.value})}
              >
                <option value="">選択してください</option>
                {channels.map((channel, index) => (
                  <option key={index} value={channel}>{channel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">案件名</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">納期</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={newProject.deadline}
                onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">納品日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={newProject.deliveryDate}
                onChange={(e) => setNewProject({...newProject, deliveryDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受注金額</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newProject.price}
                onChange={(e) => setNewProject({...newProject, price: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                className="w-full p-2 border rounded"
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
              >
                <option value="未着手">未着手</option>
                <option value="進行中">進行中</option>
                <option value="完了">完了</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={newProject.outsourced}
                onChange={(e) => setNewProject({...newProject, outsourced: e.target.checked})}
              />
              <span className="text-sm font-medium text-gray-700">外注する</span>
            </label>
          </div>
          
          {newProject.outsourced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注先</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newProject.outsourceTo}
                  onChange={(e) => setNewProject({...newProject, outsourceTo: e.target.value})}
                >
                  <option value="">選択してください</option>
                  {outsources.map((outsource, index) => (
                    <option key={index} value={outsource}>{outsource}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注金額</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newProject.outsourcePrice}
                  onChange={(e) => setNewProject({...newProject, outsourcePrice: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外注ステータス</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newProject.outsourceStatus}
                  onChange={(e) => setNewProject({...newProject, outsourceStatus: e.target.value})}
                >
                  <option value="未着手">未着手</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={() => setShowNewProjectForm(false)}
            >
              キャンセル
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleAddProject}
            >
              保存
            </button>
          </div>
        </div>
      )}
      
      {/* 案件リスト */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">チャンネル</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">案件</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">納期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">納品日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外注</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">アクション</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedFilteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.orderDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{project.channel}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{project.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.deadline}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="date"
                    className="w-full p-1 border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                    value={project.deliveryDate || ''}
                    onChange={(e) => handleDeliveryDateChange(project.id, e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <StatusIcon status={project.status} />
                    <select
                      className="ml-2 text-sm text-gray-700 border-none bg-transparent"
                      value={project.status}
                      onChange={(e) => handleStatusChange(project.id, e.target.value)}
                    >
                      <option value="未着手">未着手</option>
                      <option value="進行中">進行中</option>
                      <option value="完了">完了</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {project.outsourced ? (
                    <div>
                      <div className="text-xs text-gray-500">
                        {project.outsourceTo && <span className="mr-2 font-medium">{project.outsourceTo}</span>}
                        ¥{parseFloat(project.outsourcePrice).toLocaleString()}
                      </div>
                      <div className="flex items-center mt-1">
                        <StatusIcon status={project.outsourceStatus} />
                        <select
                          className="ml-2 text-xs text-gray-700 border-none bg-transparent"
                          value={project.outsourceStatus}
                          onChange={(e) => handleOutsourceStatusChange(project.id, e.target.value)}
                        >
                          <option value="未着手">未着手</option>
                          <option value="進行中">進行中</option>
                          <option value="完了">完了</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">自社対応</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-4 min-w-[100px]">
                    <button 
                      className="text-blue-600 hover:text-blue-900 p-1"
                      onClick={() => handleEditProject(project)}
                      title="編集"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 p-1"
                      onClick={() => handleDeleteProject(project.id)}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;