<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class Localization
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        // Récupérer la langue depuis l'en-tête Accept-Language ou le paramètre de requête
        $locale = $request->header('Accept-Language') ?? $request->query('locale') ?? config('app.locale');

        // Valider la langue
        $supportedLocales = ['en', 'fr', 'ar'];
        if (!in_array($locale, $supportedLocales)) {
            $locale = config('app.locale');
        }

        // Définir la locale
        App::setLocale($locale);

        return $next($request);
    }
}