<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DocumentController extends Controller
{
    private function publicUploadDisk(): string
    {
        return (string) config('filesystems.public_upload_disk', 'public');
    }

    public function index(Request $request)
    {
        $documents = Document::where('user_id', $request->user()->id)->paginate(15);
        return response()->json($documents);
    }

    public function show($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return response()->json($document);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'document_type' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('file')->store('documents', $this->publicUploadDisk());

        $document = Document::create([
            'user_id' => $request->user()->id,
            'document_type' => $request->document_type,
            'file_path' => $path,
            'expiry_date' => $request->expiry_date,
            'verified' => false,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document,
        ], 201);
    }

    public function destroy($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    public function verify($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $document->update(['verified' => true]);

        return response()->json([
            'message' => 'Document verified',
            'document' => $document,
        ]);
    }
}
