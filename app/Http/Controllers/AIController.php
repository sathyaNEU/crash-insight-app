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
                'data' => 'nullable|array', // Changed from 'required' to 'nullable'
                'mode' => 'required|string|in:report,qa',
                'isFollowUp' => 'boolean',
                'conversationHistory' => 'array'
            ]);

            $question = $request->input('question');
            $data = $request->input('data', []); // Provide default empty array
            $mode = $request->input('mode');
            $isFollowUp = $request->input('isFollowUp', false);
            $conversationHistory = $request->input('conversationHistory', []);

            // Convert data to CSV-like string
            $csvString = $this->convertDataToCsv($data);

            // Generate response based on mode
            if (!$isFollowUp) {
                $response = $this->generateInitialResponse($question, $csvString, $mode);
            } else {
                $response = $this->answerFollowUp($question, $csvString, $conversationHistory, $mode);
            }

            return response()->json([
                'success' => true,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generateInitialResponse($question, $csvString, $mode)
    {
        $prompt = $this->buildPrompt($mode, $question, $csvString);
        return $this->callMistralAPI($prompt);
    }

    private function buildPrompt($mode, $question, $csvString)
    {
        switch ($mode) {
            case 'report':
                return $this->getReportPrompt($question, $csvString);
            
            case 'qa':
                return $this->getQAPrompt($question, $csvString);
            
            default:
                throw new \Exception('Invalid mode specified');
        }
    }

    private function getReportPrompt($question, $csvString)
    {
        return "You are a report generation agent.

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
    }

    private function getQAPrompt($question, $csvString)
    {
        return "You are a helpful Q&A assistant with access to a dataset.

Task:
- Answer the user's question accurately based on the data provided below.
- Be concise and direct in your response.
- If the answer requires data analysis, provide clear insights with supporting numbers.
- If the data doesn't contain information to answer the question, politely say so.
- Output ONLY pure Markdown content.
- Do NOT wrap your response in code blocks (no ```markdown or ``` tags).
- Do NOT include any preamble - start directly with your answer.

User's Question: {$question}

Available Data:
{$csvString}";
    }

    private function answerFollowUp($question, $csvString, $conversationHistory, $mode)
    {
        // Build messages array from conversation history
        $messages = [];
        
        // Add system message with data context
        $systemPrompt = $this->getFollowUpSystemPrompt($mode, $csvString);
        $messages[] = [
            'role' => 'system',
            'content' => $systemPrompt
        ];

        // Add all previous conversation messages
        foreach ($conversationHistory as $message) {
            if (isset($message['role']) && isset($message['content']) && 
                in_array($message['role'], ['user', 'assistant'])) {
                $messages[] = [
                    'role' => $message['role'],
                    'content' => $message['content']
                ];
            }
        }

        // Add the new user question
        $messages[] = [
            'role' => 'user',
            'content' => $question
        ];

        Log::info('Follow-up messages prepared', [
            'message_count' => count($messages),
            'mode' => $mode
        ]);

        return $this->callMistralAPIWithMessages($messages);
    }

    private function getFollowUpSystemPrompt($mode, $csvString)
    {
        $baseContext = "You are a helpful assistant. Answer follow-up questions based on the conversation history and the data provided.

Data context:
{$csvString}

Instructions:
- Provide clear, concise answers in Markdown format
- Do NOT use code blocks or wrap responses in ```markdown
- Start directly with your answer
- Reference previous conversation context when relevant";

        return $baseContext;
    }

    private function callMistralAPI($prompt, $previousMessages = [])
    {
        $messages = array_merge($previousMessages, [
            ['role' => 'user', 'content' => $prompt]
        ]);

        return $this->callMistralAPIWithMessages($messages);
    }

    private function callMistralAPIWithMessages($messages)
    {
        try {
            Log::info('Calling Mistral API', [
                'message_count' => count($messages),
                'model' => $this->model
            ]);

            $response = Http::timeout(30)
                ->withoutVerifying()
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
        } catch (\Exception $e) {
            Log::error('Mistral API call error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function convertDataToCsv($data)
    {
        if (empty($data)) {
            return "No additional data context provided.";
        }

        // Get headers from first record
        $headers = array_keys((array)$data[0]);
        $csvString = implode(',', $headers) . "\n";

        // Add data rows
        foreach ($data as $row) {
            $values = [];
            foreach ($headers as $header) {
                $value = isset($row[$header]) ? $row[$header] : '';
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