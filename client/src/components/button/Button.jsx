import style from './Button.module.css';

export default function Button({ children , handleClick}) {
    return <button type="button" onClick={handleClick} className={style.button}>{children}</button>;
}




