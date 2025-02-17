import React, { useState, useEffect, useContext, useRef } from 'react';
import "remixicon/fonts/remixicon.css";
import { UserContext } from '../context/user.context';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import Markdown from 'markdown-to-jsx';

const Project = () => {
    const location = useLocation();
    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ selectedUserId, setSelectedUserId ] = useState(new Set());
    const [ project, setProject ] = useState(location.state?.project || {});
    const [ message, setMessage ] = useState('');
    const { user } = useContext(UserContext);
    const [ users, setUsers ] = useState([]);
    const [ messages, setMessages ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(true);
    const messageBoxRef = useRef(null);

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    // Helper function to safely get user initial
    const getUserInitial = (user) => {
        if (!user) return '?';
        if (typeof user === 'string') return user.charAt(0).toUpperCase();
        if (user.email) return user.email.charAt(0).toUpperCase();
        return '?';
    }

    // Helper function to safely get user email
    const getUserEmail = (user) => {
        if (!user) return 'Unknown User';
        if (typeof user === 'string') return user;
        if (user.email) return user.email;
        return 'Unknown User';
    }

    // Function to check if a message is from the current user
    const isMessageFromCurrentUser = (msg) => {
        return user && msg.sender && (msg.sender._id === user._id?.toString());
    };

    function addCollaborators() {
        axios.put("/project/add-user", {
            projectId: project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data);
            setIsModalOpen(false);
            // Refresh project data to show new collaborators
            fetchProjectData();
        }).catch(err => {
            console.log(err);
        });
    }

    const send = () => {
        if (!message.trim()) return;

        sendMessage('project-message', {
            message,
            sender: user
        });
        
        setMessages(prevMessages => [
            ...prevMessages,
            { sender: user, message }
        ]);
        
        setMessage("");
    }

    // Function to handle AI message parsing
    const parseAiMessage = (messageString) => {
        try {
            const parsed = JSON.parse(messageString);
            return {
                text: parsed.text || messageString,
                parsedData: parsed
            };
        } catch (e) {
            return {
                text: messageString,
                parsedData: null
            };
        }
    };

    // Function to render AI messages
    const WriteAiMessage = ({ messageContent }) => {
        const { text, parsedData } = parseAiMessage(messageContent);
        
        return (
            <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                <Markdown>
                    {text}
                </Markdown>
            </div>
        );
    };

    const fetchProjectData = () => {
        axios.get(`/project/get-project/${project._id}`)
            .then(res => {
                setProject(res.data.project);
            })
            .catch(err => {
                console.log("Error fetching project data:", err);
            });
    };

    const fetchUsers = () => {
        axios.get('/user/all')
            .then(res => {
                setUsers(res.data.users);
            })
            .catch(err => {
                console.log("Error fetching users:", err);
            });
    };

    useEffect(() => {
        if (!project?._id || !user) {
            setIsLoading(true);
            return;
        }

        setIsLoading(false);
        
        initializeSocket(project._id);
        
        receiveMessage('project-message', data => {
            if (data.sender._id === 'ai') {
                // Process AI message
                const processedData = {
                    ...data,
                    // Keep original message for reference
                    originalMessage: data.message
                };
                console.log(data);
                
                setMessages(prevMessages => [...prevMessages, processedData]);
            } else {
                // Handle regular user messages
                setMessages(prevMessages => [...prevMessages, data]);
            }
        });

        fetchProjectData();
        fetchUsers();

        return () => {
            // Clean up socket listeners when component unmounts
            // Add any necessary cleanup code for your socket implementation
        };
    }, [user, project._id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [messages]);

    // Loading state
    if (isLoading || !user) {
        return <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    return (
        <main className='h-screen w-screen flex'>
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-100">
                <header className='flex justify-between items-center p-4 w-full bg-white shadow-sm absolute z-10 top-0'>
                    <button className='flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-md transition-colors' 
                            onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill text-blue-500"></i>
                        <p className="text-slate-700">Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                            className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
                        <i className="ri-group-fill text-slate-700"></i>
                    </button>
                </header>

                {/* Modified structure to properly separate message area and input field */}
                <div className="flex flex-col h-full pt-14">
                    {/* Message area takes available space with fixed height constraints */}
                    <div
                        ref={messageBoxRef}
                        className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto"
                        style={{ height: 'calc(100% - 64px)' }} // Account for input height
                    >
                        {messages.map((msg, index) => {
                            const isFromCurrentUser = isMessageFromCurrentUser(msg);
                            const isAiMessage = msg.sender._id === 'ai';
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} w-full`}
                                >
                                    <div 
                                        className={`
                                            message flex flex-col p-3 rounded-lg shadow-sm
                                            ${isFromCurrentUser 
                                                ? 'bg-blue-500 text-white mr-2 rounded-tr-none' 
                                                : isAiMessage
                                                    ? 'bg-slate-800 text-white ml-2 rounded-tl-none' 
                                                    : 'bg-white text-slate-800 ml-2 rounded-tl-none'
                                            }
                                            max-w-xs sm:max-w-sm md:max-w-md
                                        `}
                                    >
                                        {!isFromCurrentUser && (
                                            <div className="mb-1 text-xs opacity-80">
                                                {getUserEmail(msg.sender)}
                                            </div>
                                        )}
                                        
                                        <div className={`text-sm ${isAiMessage ? 'text-white' : ''}`}>
                                            {isAiMessage ? (
                                                <WriteAiMessage messageContent={msg.message} />
                                            ) : (
                                                <Markdown>{msg.message}</Markdown>
                                            )}
                                        </div>
                                        
                                        <div className={`text-xs ${isFromCurrentUser ? 'text-blue-100 self-end' : 'text-slate-400 self-start'} mt-1`}>
                                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input field as a separate element, fixed at bottom */}
                    <div className="inputField w-full flex bg-white shadow-md" style={{ height: '64px' }}>
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && send()}
                            className='p-3 px-4 border-none outline-none flex-grow' 
                            type="text" 
                            placeholder='Type a message' 
                        />
                        <button
                            onClick={send}
                            className='px-5 bg-slate-950 text-white hover:bg-slate-800 transition-colors'>
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-white absolute transition-all duration-300 ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 shadow-lg z-20`}>
                    <header className='flex justify-between items-center px-4 p-4 bg-slate-50'>
                        <h1 className='font-semibold text-lg text-slate-800'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                                className='p-2 hover:bg-slate-200 rounded-full transition-colors'>
                            <i className="ri-close-fill text-slate-600"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 p-4">
                        {project.users && project.users.map(collaborator => (
                            <div 
                                key={collaborator._id || Math.random()} 
                                className="user cursor-pointer hover:bg-slate-100 rounded-lg p-3 flex gap-3 items-center transition-colors"
                            >
                                <div className='aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-600'>
                                    {getUserInitial(collaborator)}
                                </div>
                                <h1 className='font-medium text-slate-700'>{getUserEmail(collaborator)}</h1>
                            </div>
                        ))}
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-30">
                        <div className="bg-white p-6 rounded-xl w-96 max-w-full relative">
                            <header className='flex justify-between items-center mb-6'>
                                <h2 className='text-xl font-semibold text-slate-800'>Select Users</h2>
                                <button onClick={() => setIsModalOpen(false)} 
                                        className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
                                    <i className="ri-close-fill text-slate-600"></i>
                                </button>
                            </header>
                            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                                {users.map(userItem => (
                                    <div 
                                        key={userItem._id || Math.random()} 
                                        className={`user cursor-pointer rounded-lg transition-colors
                                                  ${Array.from(selectedUserId).includes(userItem._id) 
                                                    ? 'bg-blue-50 hover:bg-blue-100' 
                                                    : 'hover:bg-slate-100'} 
                                                  p-3 flex gap-3 items-center`} 
                                        onClick={() => handleUserClick(userItem._id)}
                                    >
                                        <div className='aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-600'>
                                            {getUserInitial(userItem)}
                                        </div>
                                        <h1 className='font-medium text-slate-700'>{getUserEmail(userItem)}</h1>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addCollaborators}
                                className='absolute bottom-6 left-6 right-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium'>
                                Add Collaborators
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );

    
    <div
    ref={messageBox}
    className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
    {messages.map((msg, index) => {
        // Check if the current message is sent by the current user
        const isSentByCurrentUser = msg.sender._id === (user && user._id ? user._id.toString() : '');
        
        return (
            <div key={index} 
                className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} 
                            ${isSentByCurrentUser ? 'self-end' : 'self-start'}  
                            message flex flex-col p-2 bg-slate-50 rounded-md`}>
                <small className='opacity-65 text-xs'>{msg.sender.email}</small>
                <div className='text-sm'>
                    {msg.sender._id === 'ai' ?
                        WriteAiMessage(msg.message)
                        : <p>{msg.message}</p>}
                </div>
            </div>
        );
    })}
</div>



};

export default Project;