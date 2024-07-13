// dialogBoxComponent.jsx
import { useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import styles from './DialogBoxComponent.module.css';

export default function DialogBox({ closeModal, open ,children}) {
    const dialog = useRef();

    useEffect(() => {
        if (open) {
            dialog.current.showModal();
        } else {
            dialog.current.close();
        }
    }, [open]);

    return createPortal(
        <div className={open ? styles.dialogOverlay : ''}>
            <dialog ref={dialog} className={styles.dialogBox} onClose={closeModal}>
                <div className={styles.dialogContent}>
                    {children}
                </div>
                <button className={styles.dialogCloseButton} onClick={closeModal}>Close</button>
            </dialog>
        </div>,
        document.getElementById('modal')
    );
}
