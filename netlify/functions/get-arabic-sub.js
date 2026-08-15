// netlify/functions/get-arabic-sub.js

// دالة لتحويل صيغة SRT إلى WebVTT التي تتوافق معها المتصفحات والمشغلات
function srtToVtt(srtContent) {
    let vtt = 'WEBVTT\n\n';
    vtt += srtContent
        .replace(/\r/g, '') // إزالة فواصل الويندوز
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2'); // تحويل الفاصلة إلى نقطة في التوقيت
    return vtt;
}

exports.handler = async function(event, context) {
    // تفعيل CORS دائماً لكي يسمح لمشغل VidSrc بقراءة الملف دون حظر
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=86400" // تخزين مؤقت ليوم كامل لتقليل استهلاك الطلبات
    };

    try {
        const imdbId = event.queryStringParameters.imdbId;
        
        if (!imdbId) {
            return { statusCode: 400, headers, body: "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n[خطأ: لم يتم توفير رقم IMDb]" };
        }

        // قراءة مفتاح API من متغيرات البيئة في Netlify
        const apiKey = process.env.OPENSUBTITLES_API_KEY;

        // 1. البحث عن الترجمة العربية في OpenSubtitles باستخدام رقم IMDb
        const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId.replace('tt', '')}&languages=ar`;
        const searchResponse = await fetch(searchUrl, {
            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' }
        });
        
        const searchData = await searchResponse.json();

        if (!searchData.data || searchData.data.length === 0) {
            // إرجاع ملف VTT فارغ حتى لا يتعطل المشغل إذا لم تتوفر ترجمة
            return { statusCode: 200, headers, body: "WEBVTT\n\n" };
        }

        // أخذ أول (أفضل) ملف ترجمة متوفر
        const fileId = searchData.data[0].attributes.files[0].file_id;

        // 2. طلب رابط التحميل المباشر لملف الترجمة
        const downloadResponse = await fetch('https://api.opensubtitles.com/api/v1/download', {
            method: 'POST',
            headers: { 
                'Api-Key': apiKey, 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ file_id: fileId })
        });

        const downloadData = await downloadResponse.json();
        const subtitleUrl = downloadData.link;

        // 3. جلب ملف الترجمة الفعلي من الرابط المباشر
        const subFileResponse = await fetch(subtitleUrl);
        const subText = await subFileResponse.text();

        // 4. تحويل النصوص إلى تنسيق VTT وضبط الترميز الداخلي
        const finalVtt = srtToVtt(subText);

        // 5. إرسال الترجمة المعالجة إلى مشغل VidSrc بترميز UTF-8 سليم
        return {
            statusCode: 200,
            headers,
            body: finalVtt
        };

    } catch (error) {
        console.error("Subtitle API Error:", error);
        return { 
            statusCode: 200, 
            headers, 
            body: "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n[حدث خطأ أثناء جلب الترجمة]" 
        };
    }
};
