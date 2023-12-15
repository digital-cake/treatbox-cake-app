<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingOption extends Model
{
    protected $fillable = ['shop', 'name', 'value'];
}
