<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActiveCarrierService extends Model
{
    protected $fillable = ['shop', 'carrier_service_id', 'name', 'callback_url'];
}
