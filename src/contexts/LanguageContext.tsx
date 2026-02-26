import { createContext, useContext, useEffect, useState } from "react";

type Language = "uz" | "en" | "ru" | "tr" | "de";

interface Translations {
    settings: {
        title: string;
        subtitle: string;
        theme: {
            title: string;
            subtitle: string;
            current: string;
        };
        language: {
            title: string;
            subtitle: string;
            current: string;
        };
    };
    common: {
        back: string;
        save: string;
        cancel: string;
    };
    editor: {
        share: string;
        copied: string;
        sync: string;
        online: string;
        room_id_copied: string;
        link_copied: string;
        share_desc: string;
    };
    explorer: {
        title: string;
        new_file: string;
        new_folder: string;
        rename: string;
        delete: string;
        file_name_placeholder: string;
        folder_name_placeholder: string;
    };
    terminal: {
        title: string;
        run: string;
        running: string;
        clear: string;
        input_title: string;
        input_desc: string;
        run_without_input: string;
        run_button: string;
        ready: string;
        ready_desc: string;
    };
    ai: {
        title: string;
        subtitle: string;
        badge: string;
        placeholder: string;
        analyzing: string;
        copy: string;
        prompts: {
            explain: string;
            fix: string;
            optimize: string;
            feature: string;
            create: string;
            refactor: string;
        };
    };
    room: {
        loading: string;
        not_found: string;
        not_found_desc: string;
        back_home: string;
    };
}

const translations: Record<Language, Translations> = {
    uz: {
        settings: {
            title: "Sozlamalar",
            subtitle: "Ilovani shaxsiylashtiring",
            theme: {
                title: "Editor Tema",
                subtitle: "O'zingizga yoqqan professional temani tanlang",
                current: "Joriy tema:",
            },
            language: {
                title: "Til",
                subtitle: "Ilova tilini tanlang",
                current: "Joriy til:",
            },
        },
        common: {
            back: "Orqaga",
            save: "Saqlash",
            cancel: "Bekor qilish",
        },
        editor: {
            share: "Ulashish",
            copied: "Nusxalandi!",
            sync: "Sinxron",
            online: "Onlayn",
            room_id_copied: "ID nusxalandi!",
            link_copied: "Link nusxalandi!",
            share_desc: "Do'stingizga yuboring va birga kod yozing!",
        },
        explorer: {
            title: "Explorer",
            new_file: "Yangi fayl",
            new_folder: "Yangi papka",
            rename: "Nomini o'zgartirish",
            delete: "O'chirish",
            file_name_placeholder: "fayl nomi...",
            folder_name_placeholder: "papka nomi...",
        },
        terminal: {
            title: "TERMINAL",
            run: "RUN",
            running: "Running...",
            clear: "Tozalash",
            input_title: "Dastur uchun input kiriting",
            input_desc: "Sizning kodingizda kiritish (input) funksiyalari bor.",
            run_without_input: "Inputsiz ishga tushirish",
            run_button: "Ishga tushirish",
            ready: "Terminal tayyor",
            ready_desc: "Kodni ishga tushirish uchun 'RUN' bosing",
        },
        ai: {
            title: "CodeForge AI",
            subtitle: "Kod yozish, fayl yaratish, optimizatsiya",
            badge: "Bepul",
            placeholder: "Fayl yarat, kod yoz, xatoni top...",
            analyzing: "Kod tahlil qilinmoqda...",
            copy: "Nusxalash",
            prompts: {
                explain: "Kodni tushuntir",
                fix: "Xatoni top",
                optimize: "Optimizatsiya",
                feature: "Yangi funksiya",
                create: "Yangi fayl yarat",
                refactor: "Kodni o'zgartir",
            },
        },
        room: {
            loading: "Xona yuklanmoqda...",
            not_found: "Xona topilmadi",
            not_found_desc: "Bu xona mavjud emas yoki o'chirilgan",
            back_home: "Bosh sahifaga qaytish",
        },
    },
    en: {
        settings: {
            title: "Settings",
            subtitle: "Customize your application",
            theme: {
                title: "Editor Theme",
                subtitle: "Choose your favorite professional theme",
                current: "Current theme:",
            },
            language: {
                title: "Language",
                subtitle: "Select application language",
                current: "Current language:",
            },
        },
        common: {
            back: "Back",
            save: "Save",
            cancel: "Cancel",
        },
        editor: {
            share: "Share",
            copied: "Copied!",
            sync: "Sync",
            online: "Online",
            room_id_copied: "ID copied!",
            link_copied: "Link copied!",
            share_desc: "Send to your friend and code together!",
        },
        explorer: {
            title: "Explorer",
            new_file: "New File",
            new_folder: "New Folder",
            rename: "Rename",
            delete: "Delete",
            file_name_placeholder: "filename...",
            folder_name_placeholder: "folder name...",
        },
        terminal: {
            title: "TERMINAL",
            run: "RUN",
            running: "Running...",
            clear: "Clear",
            input_title: "Enter Input for Program",
            input_desc: "Your code contains input functions.",
            run_without_input: "Run without input",
            run_button: "Run",
            ready: "Terminal Ready",
            ready_desc: "Press 'RUN' to execute code",
        },
        ai: {
            title: "CodeForge AI",
            subtitle: "Write code, create files, optimize",
            badge: "Free",
            placeholder: "Create file, debug code, optimize...",
            analyzing: "Analyzing code...",
            copy: "Copy",
            prompts: {
                explain: "Explain Code",
                fix: "Find Bugs",
                optimize: "Optimize",
                feature: "New Feature",
                create: "Create File",
                refactor: "Refactor Code",
            },
        },
        room: {
            loading: "Loading room...",
            not_found: "Room Not Found",
            not_found_desc: "This room does not exist or has been deleted",
            back_home: "Back to Home",
        },
    },
    ru: {
        settings: {
            title: "Настройки",
            subtitle: "Настройте приложение под себя",
            theme: {
                title: "Тема редактора",
                subtitle: "Выберите профессиональную тему",
                current: "Текущая тема:",
            },
            language: {
                title: "Язык",
                subtitle: "Выберите язык приложения",
                current: "Текущий язык:",
            },
        },
        common: {
            back: "Назад",
            save: "Сохранить",
            cancel: "Отмена",
        },
        editor: {
            share: "Поделиться",
            copied: "Скопировано!",
            sync: "Синхр.",
            online: "Онлайн",
            room_id_copied: "ID скопирован!",
            link_copied: "Ссылка скопирована!",
            share_desc: "Отправь другу и пишите код вместе!",
        },
        explorer: {
            title: "Проводник",
            new_file: "Новый файл",
            new_folder: "Новая папка",
            rename: "Переименовать",
            delete: "Удалить",
            file_name_placeholder: "имя файла...",
            folder_name_placeholder: "имя папки...",
        },
        terminal: {
            title: "ТЕРМИНАЛ",
            run: "ЗАПУСК",
            running: "Запуск...",
            clear: "Очистить",
            input_title: "Введите входные данные",
            input_desc: "Ваш код требует ввода данных.",
            run_without_input: "Запуск без ввода",
            run_button: "Запустить",
            ready: "Терминал готов",
            ready_desc: "Нажмите 'ЗАПУСК' для выполнения",
        },
        ai: {
            title: "CodeForge AI",
            subtitle: "Пиши код, создавай файлы, оптимизируй",
            badge: "Бесплатно",
            placeholder: "Создать файл, найти ошибки...",
            analyzing: "Анализ кода...",
            copy: "Копировать",
            prompts: {
                explain: "Объяснить код",
                fix: "Найти ошибки",
                optimize: "Оптимизация",
                feature: "Новая функция",
                create: "Создать файл",
                refactor: "Рефакторинг",
            },
        },
        room: {
            loading: "Загрузка комнаты...",
            not_found: "Комната не найдена",
            not_found_desc: "Эта комната не существует или была удалена",
            back_home: "На главную",
        },
    },
    tr: {
        settings: {
            title: "Ayarlar",
            subtitle: "Uygulamayı kişiselleştirin",
            theme: {
                title: "Editör Teması",
                subtitle: "Favori profesyonel temanızı seçin",
                current: "Mevcut tema:",
            },
            language: {
                title: "Dil",
                subtitle: "Uygulama dilini seçin",
                current: "Mevcut dil:",
            },
        },
        common: {
            back: "Geri",
            save: "Kaydet",
            cancel: "İptal",
        },
        editor: {
            share: "Paylaş",
            copied: "Kopyalandı!",
            sync: "Senkron",
            online: "Çevrimiçi",
            room_id_copied: "ID kopyalandı!",
            link_copied: "Link kopyalandı!",
            share_desc: "Arkadaşına gönder ve birlikte kodla!",
        },
        explorer: {
            title: "Dosyalar",
            new_file: "Yeni Dosya",
            new_folder: "Yeni Klasör",
            rename: "Yeniden Adlandır",
            delete: "Sil",
            file_name_placeholder: "dosya adı...",
            folder_name_placeholder: "klasör adı...",
        },
        terminal: {
            title: "TERMİNAL",
            run: "ÇALIŞTIR",
            running: "Çalışıyor...",
            clear: "Temizle",
            input_title: "Giriş Verisi Yazın",
            input_desc: "Kodunuz giriş verisi gerektiriyor.",
            run_without_input: "Girişsiz çalıştır",
            run_button: "Çalıştır",
            ready: "Terminal Hazır",
            ready_desc: "Kodu çalıştırmak için 'ÇALIŞTIR'a basın",
        },
        ai: {
            title: "CodeForge AI",
            subtitle: "Kod yaz, dosya oluştur, optimize et",
            badge: "Ücretsiz",
            placeholder: "Dosya oluştur, hata bul...",
            analyzing: "Kod analiz ediliyor...",
            copy: "Kopyala",
            prompts: {
                explain: "Kodu Açıkla",
                fix: "Hata Bul",
                optimize: "Optimize Et",
                feature: "Yeni Özellik",
                create: "Dosya Oluştur",
                refactor: "Yeniden Düzenle",
            },
        },
        room: {
            loading: "Oda yükleniyor...",
            not_found: "Oda Bulunamadı",
            not_found_desc: "Bu oda mevcut değil veya silinmiş",
            back_home: "Ana Sayfaya Dön",
        },
    },
    de: {
        settings: {
            title: "Einstellungen",
            subtitle: "Passen Sie Ihre Anwendung an",
            theme: {
                title: "Editor-Design",
                subtitle: "Wählen Sie Ihr bevorzugtes Design",
                current: "Aktuelles Design:",
            },
            language: {
                title: "Sprache",
                subtitle: "Wählen Sie die Anwendungssprache",
                current: "Aktuelle Sprache:",
            },
        },
        common: {
            back: "Zurück",
            save: "Speichern",
            cancel: "Abbrechen",
        },
        editor: {
            share: "Teilen",
            copied: "Kopiert!",
            sync: "Sync",
            online: "Online",
            room_id_copied: "ID kopiert!",
            link_copied: "Link kopiert!",
            share_desc: "Sende es an deinen Freund und code zusammen!",
        },
        explorer: {
            title: "Explorer",
            new_file: "Neue Datei",
            new_folder: "Neuer Ordner",
            rename: "Umbenennen",
            delete: "Löschen",
            file_name_placeholder: "Dateiname...",
            folder_name_placeholder: "Ordnername...",
        },
        terminal: {
            title: "TERMINAL",
            run: "START",
            running: "Läuft...",
            clear: "Löschen",
            input_title: "Eingabe für Programm",
            input_desc: "Ihr Code erfordert Eingaben.",
            run_without_input: "Ohne Eingabe starten",
            run_button: "Starten",
            ready: "Terminal Bereit",
            ready_desc: "Drücken Sie 'START', um Code auszuführen",
        },
        ai: {
            title: "CodeForge AI",
            subtitle: "Code schreiben, Dateien erstellen, optimieren",
            badge: "Kostenlos",
            placeholder: "Datei erstellen, Fehler finden...",
            analyzing: "Analysiere Code...",
            copy: "Kopieren",
            prompts: {
                explain: "Code erklären",
                fix: "Fehler finden",
                optimize: "Optimieren",
                feature: "Neues Feature",
                create: "Datei erstellen",
                refactor: "Code refactoring",
            },
        },
        room: {
            loading: "Raum wird geladen...",
            not_found: "Raum nicht gefunden",
            not_found_desc: "Dieser Raum existiert nicht oder wurde gelöscht",
            back_home: "Zurück zur Startseite",
        },
    },
};

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        // Try to get from localStorage
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("app-language");
            if (saved && Object.keys(translations).includes(saved)) {
                return saved as Language;
            }
        }
        return "uz"; // Default
    });

    useEffect(() => {
        localStorage.setItem("app-language", language);
    }, [language]);

    const value = {
        language,
        setLanguage,
        t: translations[language],
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};

export const languages: { id: Language; name: string; flag: string }[] = [
    { id: "uz", name: "O'zbek", flag: "🇺🇿" },
    { id: "en", name: "English", flag: "🇬🇧" },
    { id: "ru", name: "Русский", flag: "🇷🇺" },
    { id: "tr", name: "Türkçe", flag: "🇹🇷" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
];
