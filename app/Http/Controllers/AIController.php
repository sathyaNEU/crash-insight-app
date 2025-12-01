<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    private $apiKey;
    private $model = 'mistral-small-2506';
    private $apiUrl = 'https://api.mistral.ai/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('MISTRAL_API_KEY');
    }

    public function chat(Request $request)
    {
        try {
            $request->validate([
                'question' => 'required|string',
                'data' => 'required|array',
                'isFollowUp' => 'boolean',
                'conversationHistory' => 'array'
            ]);

            $question = $request->input('question');
            $data = $request->input('data');
            $isFollowUp = $request->input('isFollowUp', false);
            $conversationHistory = $request->input('conversationHistory', []);

            // Convert data to CSV-like string
            $csvString = $this->convertDataToCsv($data);

            // Generate the report or answer follow-up
            if (!$isFollowUp) {
                $response = $this->generateReport($question, $csvString);
            } else {
                $response = $this->answerFollowUp($question, $csvString, $conversationHistory);
            }

            return response()->json([
                'success' => true,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generateReport($question, $csvString)
    {
        $prompt = "You are a report generation agent.

Task:
- Generate a crisp, data-driven report based only on the given context below.
- Follow standard report steps: overview, key patterns, contributing factors, and conclusion.
- Output ONLY pure Markdown content.
- Do NOT wrap your response in code blocks (no ```markdown or ``` tags).
- Do NOT include any preamble or explanation outside the report.
- Start directly with the markdown heading.
- Keep it concise and to the point.

Context:
Generate a report about: {$question} based on the below data
{$csvString}";

        return $this->callMistralAPI($prompt);
    }

    private function answerFollowUp($question, $csvString, $conversationHistory)
    {
        // Build context from conversation history
        $contextMessages = [];
        foreach ($conversationHistory as $message) {
            if ($message['role'] === 'assistant') {
                $contextMessages[] = [
                    'role' => 'assistant',
                    'content' => $message['content']
                ];
            }
        }

        $prompt = "You are a helpful data analyst assistant. Answer the user's follow-up question based on the previous conversation and the data provided.

Previous analysis context exists in the conversation history.

User's question: {$question}

Data context (top 10 records):
{$csvString}

Provide a clear, concise answer in Markdown format. Do NOT use code blocks. Start directly with your answer.";

        return $this->callMistralAPI($prompt, $contextMessages);
    }

    private function callMistralAPI($prompt, $previousMessages = [])
    {
        try {
            $messages = array_merge($previousMessages, [
                ['role' => 'user', 'content' => $prompt]
            ]);

            Log::info('Calling Mistral API', [
                'message_count' => count($messages)
            ]);

            $response = Http::timeout(30)
                ->withoutVerifying() // Add this line for local development
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiUrl, [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 2000
                ]);

            if ($response->failed()) {
                $errorBody = $response->body();
                Log::error('Mistral API Error', [
                    'status' => $response->status(),
                    'body' => $errorBody
                ]);
                throw new \Exception('Mistral API request failed: ' . $errorBody);
            }

            $result = $response->json();

            if (!isset($result['choices'][0]['message']['content'])) {
                Log::error('Unexpected Mistral API response format', ['response' => $result]);
                throw new \Exception('Unexpected API response format');
            }

            return $result['choices'][0]['message']['content'];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Connection error to Mistral API: ' . $e->getMessage());
            throw new \Exception('Failed to connect to AI service. Please try again.');
        }
    }

    private function convertDataToCsv($data)
    {
        if (empty($data)) {
            return "No data available";
        }

        // Get headers from first record
        $headers = array_keys((array)$data[0]);
        $csvString = implode(',', $headers) . "\n";

        // Add data rows
        foreach ($data as $row) {
            $values = [];
            foreach ($headers as $header) {
                $value = $row[$header] ?? '';
                // Escape commas and quotes
                if (strpos($value, ',') !== false || strpos($value, '"') !== false) {
                    $value = '"' . str_replace('"', '""', $value) . '"';
                }
                $values[] = $value;
            }
            $csvString .= implode(',', $values) . "\n";
        }

        return $csvString;
    }
}
