// components/UpdateToast.tsx
import React from 'react';

interface UpdateToastProps {
    onUpdate: () => void;
}

const UpdateToast: React.FC<UpdateToastProps> = ({ onUpdate }) => {
    return (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
            <div>
                <p className="font-bold">Update Available</p>
                <p className="text-sm">A new version of the game is ready.</p>
            </div>
            <button
                onClick={onUpdate}
                className="bg-white text-blue-600 font-bold py-1 px-3 rounded hover:bg-blue-100"
            >
                Reload
            </button>
        </div>
    );
};

export default UpdateToast;
