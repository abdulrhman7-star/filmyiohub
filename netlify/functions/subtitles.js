export default async (request) => {
    const url = new URL(request.url);

    const subtitleUrl =
        url.searchParams.get("url");

    if (!subtitleUrl) {
        return new Response(
            JSON.stringify({
                error: "Missing subtitle URL"
            }),
            {
                status: 400,
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );
    }

    try {

        /*
         * اجلب ملف الترجمة
         */

        const response =
            await fetch(subtitleUrl);

        if (!response.ok) {
            throw new Error(
                `Subtitle HTTP ${response.status}`
            );
        }

        /*
         * نقرأ الملف كنص.
         */

        const text =
            await response.text();

        /*
         * تحويل SRT إلى WebVTT
         */

        let vtt =
            convertSrtToVtt(text);

        /*
         * ضمان UTF-8 وإزالة BOM
         */

        vtt =
            vtt.replace(/^\uFEFF/, "");

        /*
         * نرسل الملف إلى المتصفح
         */

        return new Response(
            vtt,
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "text/vtt; charset=utf-8",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Cache-Control":
                        "public, max-age=300"
                }
            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                error:
                    error.message
            }),
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );
    }
};


/*
============================================================
 SRT → WEBVTT
============================================================
*/

function convertSrtToVtt(srt) {

    let result =
        srt
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(
                /(\d{2}):(\d{2}):(\d{2}),(\d{3})/g,
                "$1:$2:$3.$4"
            );

    /*
     * إزالة رقم أول subtitle
     */

    result =
        result.replace(
            /^\s*\d+\s*\n/,
            ""
        );

    return (
        "WEBVTT\n\n" +
        result.trim() +
        "\n"
    );
}
